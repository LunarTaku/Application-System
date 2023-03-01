const {
  ChatInputCommandInteraction,
  Client,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const appSchema = require("../../schemas/appschema");
const userSchema = require("../../schemas/userAppSchema");
module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    const { customId } = interaction;
    if (customId !== "apply") return;

    const data = await userSchema.findOne({ guildId: interaction.guildId });
    if (data && data.userId === interaction.user.id)
      return interaction.reply({
        content: "You have already applied for this server. Please wait for a response.",
        ephemeral: true,
      });

    const modal = new ModalBuilder()
      .setCustomId("application-modal")
      .setTitle(`Apply for this server!`);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setPlaceholder("Why do you want to join?")
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true)
      .setLabel("Reason for joining")
      .setStyle(TextInputStyle.Paragraph);
    const ageInput = new TextInputBuilder()
      .setLabel("Age")
      .setCustomId("age")
      .setPlaceholder("How old are you?")
      .setMinLength(1)
      .setMaxLength(3)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);
    const nameInput = new TextInputBuilder()
      .setLabel("Name")
      .setCustomId("name")
      .setPlaceholder("What is your name? (optional)")
      .setMaxLength(100)
      .setRequired(false)
      .setStyle(TextInputStyle.Short);
    const pronounsInput = new TextInputBuilder()
      .setLabel("Pronouns")
      .setCustomId("pronouns")
      .setPlaceholder("What are your pronouns? (optional)")
      .setMaxLength(100)
      .setRequired(false)
      .setStyle(TextInputStyle.Short);
    const locationInput = new TextInputBuilder()
      .setLabel("Location")
      .setCustomId("location")
      .setRequired(false)
      .setPlaceholder("What continent are you from? (optional)")
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short);

    const reason = new ActionRowBuilder().addComponents(reasonInput);
    const age = new ActionRowBuilder().addComponents(ageInput);
    const name = new ActionRowBuilder().addComponents(nameInput);
    const pronouns = new ActionRowBuilder().addComponents(pronounsInput);
    const location = new ActionRowBuilder().addComponents(locationInput);

    modal.addComponents(reason, age, name, pronouns, location);

    await interaction.showModal(modal);
  },
};
