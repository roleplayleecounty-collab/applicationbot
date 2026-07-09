const {
Client,
GatewayIntentBits,
Partials,
PermissionsBitField,
ChannelType,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
SlashCommandBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const { Collection, Events } = require("discord.js");

require("dotenv").config();

/* =========================
   CLIENT
========================= */

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.DirectMessages
],
partials: [Partials.Channel]
});

/* =========================
   MEMORY STORAGE
========================= */

const apps = {};

/* =========================
   QUESTIONS
========================= */

const QUESTIONS = [
"Discord username?",
"Age?",
"Lunar Tag username?",
"Timezone?",
"Daily activity hours?",
"Past staff experience?",
"Why do you want staff?",
"What makes you unique?",
"How do you handle toxicity?",
"How do you handle exploiting?",
"What if staff breaks rules?",
"Anything else?"
];

// =========================
// SLASH COMMAND HANDLER
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: "❌ This command does not exist.",
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction, client);
    } catch (err) {
        console.log(err);
        interaction.reply({
            content: "⚠️ Error running command.",
            ephemeral: true
        });
    }
});

// =========================
// LOAD COMMANDS
// =========================
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    client.commands.set(command.data.name, command);
}

/* =========================
   READY
========================= */

client.once("ready", () => {
console.log(`${client.user.tag} is ONLINE`);



    // Set bot status to DND
    client.user.setPresence({
        status: "dnd"
    });

    const activities = [
        { name: "Watching Players", type: 3 }, // WATCHING
        { name: "Playing Lunar Tag", type: 0 }, // PLAYING
        { name: "Watching Staff", type: 3 },
        { name: "Completing Applications", type: 2 }, // LISTENING
        { name: "Reviewing Staff Apps", type: 2 },
        { name: "Managing the Server", type: 0 }
    ];

    let index = 0;

    setInterval(() => {
        const activity = activities[index];

        client.user.setPresence({
            status: "dnd",
            activities: [
                {
                    name: activity.name,
                    type: activity.type
                }
            ]
        });

        index = (index + 1) % activities.length;
    }, 15000); // 15 seconds
});

/* =========================
   PANEL COMMAND
========================= */

client.on("messageCreate", async (message) => {
if (message.author.bot) return;

const prefix = process.env.PREFIX || "?";

/* PANEL */
if (message.content === `${prefix}ticketembed`) {

const embed = new EmbedBuilder()
.setTitle("🌙 Staff Application System")
.setColor("Purple")
.setDescription(
`Welcome to the staff application system!\n\n` +
`📌 **How it works:**\n` +
`• Click "Apply for Staff"\n` +
`• A private application channel is created\n` +
`• You will answer **12 questions one by one**\n` +
`• After each answer, type **next**\n` +
`• When finished, type **finish**\n\n` +
`📌 **Commands inside application:**\n` +
`• next → go to next question\n` +
`• edit <number> → edit a question answer\n` +
`• finish → submit application\n\n` +
`⚠️ Do NOT spam or skip questions`
);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("apply_start")
.setLabel("Apply for Staff")
.setStyle(ButtonStyle.Success)
);

return message.channel.send({
embeds: [embed],
components: [row]
});
}
});

/* =========================
   START APPLICATION
========================= */

client.on("interactionCreate", async (interaction) => {
if (!interaction.isButton()) return;

if (interaction.customId === "apply_start") {

if (apps[interaction.user.id]) {
return interaction.reply({
content: "❌ You already have an active application.",
ephemeral: true
});
}

const channel = await interaction.guild.channels.create({
name: `app-${interaction.user.username}`,
type: ChannelType.GuildText,
parent: process.env.APPLICATION_CATEGORY,
permissionOverwrites: [
{
id: interaction.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
{
id: interaction.user.id,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages,
PermissionsBitField.Flags.ReadMessageHistory
]
},
{
id: process.env.SHR_ROLE,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},
{
id: client.user.id,
allow: [PermissionsBitField.Flags.ViewChannel]
}
]
});

apps[interaction.user.id] = {
channelId: channel.id,
current: 0,
answers: {},
editing: null
};

/* WELCOME MESSAGE */
const welcome = new EmbedBuilder()
.setTitle("🎟️ Application Started")
.setColor("Purple")
.setDescription(
`Welcome <@${interaction.user.id}>!\n\n` +
`📌 You are now starting your staff application.\n\n` +
`👉 Rules:\n` +
`• Answer clearly and honestly\n` +
`• Do NOT spam\n` +
`• Use **next** after each answer\n` +
`• Use **edit <number>** to fix mistakes\n\n` +
`📩 First question is below...`
);

await channel.send({ embeds: [welcome] });

sendQuestion(channel, 0);

return interaction.reply({
content: `✅ Your application channel has been created: ${channel}`,
ephemeral: true
});
}


/* =========================
   ACCEPT / DENY
========================= */

if (
  interaction.customId.startsWith("accept_") ||
  interaction.customId.startsWith("deny_")
) {

  /* =========================
     🔐 PERMISSION CHECK
  ========================= */

  if (!interaction.member.roles.cache.has(process.env.SHR_ROLE)) {
    return interaction.reply({
      content: "❌ You do not have permission to review applications.",
      ephemeral: true
    });
  }

  const userId = interaction.customId.split("_")[1];
  const accepted = interaction.customId.startsWith("accept_");

  /* =========================
     🧠 FETCH MEMBER SAFELY
  ========================= */

  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "❌ User not found in server (they may have left).",
      ephemeral: true
    });
  }

  /* =========================
     ⚡ ACKNOWLEDGE INTERACTION
     (prevents "interaction failed")
  ========================= */

  await interaction.deferUpdate();

  /* =========================
     🎭 ROLE HANDLING (FIXED + MULTI ROLE SUPPORT)
     .env MUST CONTAIN:
     STAFF_ROLES=roleId1,roleId2
  ========================= */

  const staffRoles = process.env.STAFF_ROLES
    ? process.env.STAFF_ROLES.split(",").map(r => r.trim()).filter(Boolean)
    : [];

  if (accepted && staffRoles.length > 0) {
    await member.roles.add(staffRoles).catch(err => {
      console.log("Role add error:", err);
    });
  }

  /* =========================
     📩 DM USER RESULT
  ========================= */

  const user = await interaction.client.users.fetch(userId).catch(() => null);

  if (user) {
    user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(accepted ? "🎉 ACCEPTED" : "❌ DENIED")
          .setColor(accepted ? "Green" : "Red")
          .setDescription(
            accepted
              ? "Congratulations! You have been accepted into the staff team."
              : "Unfortunately, your application has been denied."
          )
      ]
    }).catch(() => {});
  }

  /* =========================
     🧹 DISABLE BUTTONS
  ========================= */

  return interaction.editReply({
    content: `✅ Application has been **${accepted ? "ACCEPTED" : "DENIED"}**.`,
    components: []
  });
}
});
/* =========================
   MESSAGE SYSTEM
========================= */

client.on("messageCreate", async (message) => {
if (message.author.bot) return;

const app = apps[message.author.id];
if (!app) return;

if (message.channel.id !== app.channelId) return;

const content = message.content.trim();
const lower = content.toLowerCase();

/* =========================
   FINISH COMMAND
========================= */

if (lower === "finish") {

const review = message.guild.channels.cache.get(process.env.REVIEW_CHANNEL);

if (!review) {
return message.channel.send("❌ Review channel not set.");
}

const embed = buildEmbed(message.author.id, app);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`accept_${message.author.id}`)
.setLabel("Accept")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`deny_${message.author.id}`)
.setLabel("Deny")
.setStyle(ButtonStyle.Danger)
);


await review.send({
content: `📢 <@&${process.env.SHR_ROLE}> New Staff Application`,
embeds: [embed],
components: [row]
});

delete apps[message.author.id];

return message.channel.send(
"📨 Your application has been submitted!\nStaff will review it soon."
);
}

/* =========================
   EDIT COMMAND
========================= */

if (lower.startsWith("edit ")) {

const num = parseInt(content.split(" ")[1]);

if (!num || num < 1 || num > QUESTIONS.length) {
return message.reply("❌ Invalid question number.");
}

app.editing = num;

return message.reply(
`✏️ You are now editing Question ${num}.\nSend your new answer.`
);
}

/* =========================
   HANDLE EDIT
========================= */

if (app.editing) {
app.answers[app.editing] = content;
app.editing = null;

return message.reply("✅ Answer updated successfully.");
}

/* =========================
   NEXT COMMAND
========================= */

if (lower === "next") {

app.current++;

if (app.current >= QUESTIONS.length) {
return message.channel.send(
"✅ You reached the final question!\n👉 Type **finish** to submit your application."
);
}

sendQuestion(message.channel, app.current);

return message.reply("➡️ Next question sent.");
}

/* =========================
   ANSWER SYSTEM
========================= */

const qIndex = app.current + 1;

/* prevent overwrite */
if (app.answers[qIndex]) {
return message.reply(
`⚠️ You already answered Question ${qIndex}.\nUse \`edit ${qIndex}\` to change it.`
);
}

/* validation */
if (content.length < 2) {
return message.reply("❌ Answer too short.");
}

/* save answer */
app.answers[qIndex] = content;

return message.reply(
"✅ Answer saved!\n📌 Type **next** to continue to the next question."
);
});

/* =========================
   SEND QUESTION
========================= */

function sendQuestion(channel, index) {

const embed = new EmbedBuilder()
.setTitle(`📝 Question ${index + 1}/${QUESTIONS.length}`)
.setColor("Purple")
.setDescription(QUESTIONS[index])
.addFields(
{
name: "📌 Instructions",
value:
"• Type your answer in chat\n• Then type **next**\n• Or use **edit <number>** if needed"
},
{
name: "📊 Progress",
value: `${Math.round(((index + 1) / QUESTIONS.length) * 100)}%`
}
);

channel.send({ embeds: [embed] });
}

/* =========================
   BUILD REVIEW EMBED
========================= */

function buildEmbed(userId, app) {

const embed = new EmbedBuilder()
.setTitle("📨 New Staff Application")
.setColor("Purple")
.setDescription(`Applicant: <@${userId}>`);

for (const [q, a] of Object.entries(app.answers)) {
embed.addFields({
name: `Question ${q}`,
value: a || "No answer"
});
}

return embed;
}


require("dotenv").config();

client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const ownerId = process.env.OWNER_ID;
    const bypassRoleId = process.env.BYPASS_ROLE_ID;
    const logChannelId = process.env.LOG_CHANNEL_ID;

    const deletePing = process.env.DELETE_PING === "true";
    const warnReply = process.env.WARN_REPLY === "true";
    const enableTimeout = process.env.ENABLE_TIMEOUT === "false";

    const timeoutDuration = Number(process.env.TIMEOUT_DURATION || 0);
    const cooldownSeconds = Number(process.env.COOLDOWN_SECONDS || 20);

    // detect owner mention
    const isMentioned = message.mentions.users.has(ownerId);
    if (!isMentioned) return;

    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;

    // bypass role check
    if (member.roles.cache.has(bypassRoleId)) return;

    // cooldown system
    const cooldown = client.antipingCooldown || (client.antipingCooldown = new Map());

    const now = Date.now();
    const last = cooldown.get(member.id) || 0;

    if (now - last < cooldownSeconds * 1000) return;
    cooldown.set(member.id, now);

    // delete original ping
    if (deletePing) {
        message.delete().catch(() => {});
    }

    // ===== EMBED WARNING =====
    if (warnReply) {
        const warnEmbed = {
            color: 0xffcc00,
            title: "⚠️ Please Do Not Ping the Owner",
            description:
                `Hey ${message.author}, please do not ping the **developer / owner**.\n\n` +
                `He may be busy and unavailable at the moment.`,
            fields: [
                {
                    name: "👤 User",
                    value: `${message.author.tag}`,
                    inline: true
                },
                {
                    name: "📍 Channel",
                    value: `${message.channel}`,
                    inline: true
                }
            ],
            footer: {
                text: "Automated Moderation System"
            },
            timestamp: new Date()
        };

        const msg = await message.channel.send({ embeds: [warnEmbed] });

        setTimeout(() => msg.delete().catch(() => {}), 8000);
    }

    // ===== TIMEOUT =====
    if (enableTimeout) {
        member.timeout(timeoutDuration, "Pinged owner/developer").catch(() => {});
    }

    // ===== LOGGING EMBED =====
    const logChannel = message.guild.channels.cache.get(logChannelId);

    if (logChannel) {
        const logEmbed = {
            color: 0xff0000,
            title: "🚨 Owner Ping Detected",
            description: "A user attempted to ping the server owner/developer.",
            fields: [
                {
                    name: "User",
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: "Channel",
                    value: `${message.channel} (${message.channel.id})`,
                    inline: false
                },
                {
                    name: "Message Content",
                    value: message.content?.slice(0, 1024) || "No content"
                }
            ],
            footer: {
                text: "Moderation Log System"
            },
            timestamp: new Date()
        };

        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
});


// =========================
// CUSTOM COMMAND HANDLER
// =========================
function handleSpecialCommands(prompt) {
    const text = prompt.toLowerCase();

    // =========================
    // INSTALL / DOWNLOAD
    // =========================
    if (
        text.includes("download") ||
        text.includes("install") ||
        text.includes("how do i get") ||
        text.includes("get lunar tag") ||
        text.includes("install lunar tag")
    ) {
        return {
            color: 0x00bfff,
            title: "📦 Lunar Tag Installation",
            description:
                "You can download **Lunar Tag** from the Meta Horizon Store or App Lab.\n\n" +
                "🔎 Search: **Lunar Tag 3.3**\n\n" +
                "Once installed, open it from your library and you’re ready to play 👍"
        };
    }

    // =========================
    // STAFF APPLICATIONS
    // =========================
    if (
        text.includes("apply") ||
        text.includes("application") ||
        text.includes("staff app") ||
        text.includes("how do i apply") ||
        text.includes("apply for staff")
    ) {
        return {
            color: 0x00ff99,
            title: "📋 Staff Application Info",
            description:
                "🧾 To apply for staff, please use our official application system.\n\n" +
                "👉 Apply through our application bot in <#1510312207601106967>\n\n" +
                "📌 Make sure you read all requirements before submitting your application.\n\n" +
                "Good luck 👍"
        };
    }

    // =========================
    // NO MATCH
    // =========================
    return null;
}

// =========================
// MAIN AI SYSTEM
// =========================
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const prefix = "hey lunar ai";

    if (!message.content.toLowerCase().startsWith(prefix)) return;

    const prompt = message.content.slice(prefix.length).trim();

    if (!prompt) {
        return message.reply({
            embeds: [
                {
                    color: 0xffcc00,
                    title: "⚠️ Lunar AI",
                    description: "Ask something after `hey lunar ai`",
                    timestamp: new Date()
                }
            ]
        });
    }

    // =========================
    // STEP 1: CUSTOM RESPONSES
    // =========================
    const special = handleSpecialCommands(prompt);

    if (special) {
        return message.reply({
            embeds: [
                {
                    ...special,
                    footer: {
                        text: "Lunar Support System"
                    },
                    timestamp: new Date()
                }
            ]
        });
    }

    // =========================
    // STEP 2: AI RESPONSE
    // =========================
    await message.channel.sendTyping();

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://discord.com",
                "X-Title": "Lunar AI Bot"
            },
            body: JSON.stringify({
                model: "openrouter/free",

                messages: [
                    {
                        role: "system",
                        content:
                            "You are Lunar AI, a helpful Discord assistant. " +
                            "You explain things clearly, naturally, and sometimes in detail."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],

                temperature: 0.8,
                max_tokens: 500
            })
        });

        const data = await res.json();

        // =========================
        // ERROR HANDLING
        // =========================
        if (data.error) {
            console.log(data.error);
            return message.reply("⚠️ AI error: " + data.error.message);
        }

        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            return message.reply("❌ AI didn’t respond.");
        }

        // =========================
        // CLEAN + FORMAT
        // =========================
        const cleanReply = reply.slice(0, 4096);

        return message.reply({
            embeds: [
                {
                    color: 0x9b59b6,
                    title: "🧠 Lunar AI",
                    description: cleanReply,
                    footer: {
                        text: `Requested by ${message.author.tag}`
                    },
                    timestamp: new Date()
                }
            ]
        });

    } catch (err) {
        console.log("Lunar AI Error:", err);

        return message.reply({
            embeds: [
                {
                    color: 0xff0000,
                    title: "⚠️ AI Error",
                    description: "AI is currently unavailable. Please try again later.",
                    timestamp: new Date()
                }
            ]
        });
    }
});


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.guild) {
        return message.channel.send(
            "❌ This bot cannot receive DMs.\n\n📩 Open a ticket in the server for support."
        );
    }
});

const { createCanvas, loadImage, registerFont } = require("canvas");

client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get("1510312207454310477");
    if (!channel) return;

    // =========================
    // CREATE CANVAS
    // =========================
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#2c2f33";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // top bar
    ctx.fillStyle = "#9b59b6";
    ctx.fillRect(0, 0, canvas.width, 10);

    // text: WELCOME
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Sans";
    ctx.fillText("WELCOME", 250, 90);

    // username
    ctx.font = "30px Sans";
    ctx.fillText(`${member.user.username}`, 250, 140);

    // member count
    ctx.font = "20px Sans";
    ctx.fillText(`Member #${member.guild.memberCount}`, 250, 190);

    // avatar circle
    const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 128 });

    const avatar = await loadImage(avatarURL);

    // circle mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatar, 50, 50, 150, 150);
    ctx.restore();

    // border around avatar
    ctx.strokeStyle = "#9b59b6";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2);
    ctx.stroke();

    // =========================
    // SEND IMAGE
    // =========================
    channel.send({
        content: `👋 Welcome ${member} to the server!`,
        files: [{
            attachment: canvas.toBuffer(),
            name: "welcome.png"
        }]
    });
});

/* =========================
   LOGIN
========================= */

client.login(process.env.TOKEN);