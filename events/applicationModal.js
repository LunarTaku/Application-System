const {
  ChatInputCommandInteraction,
  Client,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const userAppSchema = require("../../schemas/userAppSchema");
const appSchema = require("../../schemas/appschema");
const { Types } = require("mongoose");
module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "application-modal") return console.log("Invalid modal ID");
    const data = await appSchema.findOne({ guildId: interaction.guild.id });

    if (!data) return interaction.reply("There is no application setup for this server. Contact the admins to set one up.");
    if (!data.channelId) return interaction.reply("The channel for the application is not found.");

    const channel = interaction.guild.channels.cache.get(data.channelId);

    const reason = interaction.fields.getTextInputValue("reason");
    const age = interaction.fields.getTextInputValue("age");
    const name = interaction.fields.getTextInputValue("name") || "not provided";
    const pronouns = interaction.fields.getTextInputValue("pronouns") || "not provided";
    const location = interaction.fields.getTextInputValue("location") || "not provided";

    await new userAppSchema({
      _id: Types.ObjectId(),
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      reason: reason,
      age: age,
      name: name,
      pronouns: pronouns,
      location: location,
    })
      .save()
      .then(async (schema) => {
        const embed = new EmbedBuilder()
          .setTitle(`New Application for ${interaction.guild.name}`)
          .setDescription(`**APPLICATION ID:** ${schema._id}`)
          .addFields(
            {
              name: "User",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
            {
              name: "Reason",
              value: `\`\`\`${reason}\`\`\``,
              inline: true,
            },
            {
              name: "Age",
              value: `${age}`,
              inline: true,
            },
            {
              name: "Name",
              value: `${name}`,
              inline: true,
            },
            {
              name: "Pronouns",
              value: `${pronouns}`,
              inline: true,
            },
            {
              name: "Location",
              value: `${location}`,
              inline: true,
            }
          )
          .setFooter({ text: `User ID: ${interaction.user.id}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });

        return await interaction.reply({ content: "Your application has been submitted! Please wait for the moderators to verify your application!",  });
      });
  },
};
