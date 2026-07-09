const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows bot commands"),

    async execute(interaction) {
        return interaction.reply({
            embeds: [
                {
                    color: 0x9b59b6,
                    title: "🤖 Lunar Bot Help",
                    description:
                        "Commands:\n" +
                        "• heylunar ai - Talk to Lunar AI\n" +
                        "• /apply - Staff applications info(comingsoon)\n\n" +
                        "More coming soon 🚀",
                    timestamp: new Date()
                }
            ]
        });
    }
};