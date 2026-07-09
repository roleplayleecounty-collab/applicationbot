const { REST, Routes } = require("discord.js");
require("dotenv").config();

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🧹 Clearing GLOBAL slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );

    console.log("✅ All GLOBAL slash commands removed.");
  } catch (err) {
    console.error("Error clearing commands:", err);
  }
})();