const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wilt")
        .setDescription("What is Lunar Tag? (Game info + competitive scene)"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle("🌙 What is Lunar Tag?")
            .setDescription(
                "**Lunar Tag** is a fast-paced VR movement tag game inspired by Gorilla Tag style gameplay.\n\n" +
                "You swing, climb, wall-run, and outplay other players using pure movement skill.\n"
            )
            .addFields(
                {
                    name: "🎮 Core Gameplay",
                    value:
                        "• Tag-based chase system\n" +
                        "• Momentum movement mechanics\n" +
                        "• Climbing & wall movement\n" +
                        "• Skill-based movement physics",
                },
                {
                    name: "🧠 What makes it different?",
                    value:
                        "Unlike normal GTAG copies, Lunar Tag focuses on:\n" +
                        "• Cleaner physics\n" +
                        "• Competitive balance\n" +
                        "• Optimized movement feel\n" +
                        "• Less lag + smoother gameplay"
                },
                {
                    name: "🏆 Competitive Scene",
                    value:
                        "Lunar Tag supports **competitive teams & scrims**:\n" +
                        "• Team vs Team matches\n" +
                        "• Ranked-style gameplay (planned/active depending on server)\n" +
                        "• Tryouts for comp teams\n" +
                        "• Tournament events"
                },
                {
                    name: "👥 Comp Teams",
                    value:
                        "Players can join or create teams such as:\n" +
                        "• LTOfficial\n" +
                        "• Community teams (player-made)\n\n" +
                        "Teams compete in scrims and events for recognition."
                },
                {
                    name: "📥 How to Play",
                    value:
                        "1. Download Lunar Tag\n" +
                        "2. Join the server\n" +
                        "3. Learn movement mechanics\n" +
                        "4. Join matches / comps\n\n" +
                        "👉 Use `/ai install` or ask **hey lunar ai install** for help"
                }
            )
            .setFooter({
                text: "Lunar Tag • VR Movement Competitive Game"
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};