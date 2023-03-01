const {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  EmbedBuilder,
  time,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const appSchema = require("../../schemas/appschema.js");
const { Types } = require("mongoose");
const userAppSchema = require("../../schemas/userAppSchema.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("applications")
    .setDescription("Verify a user or setup the verification system..")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("setup")
        .setDescription("Setup the verification system.")
        .addChannelOption((channel) => {
          return channel
            .setName("channel")
            .setDescription("The channel to send the verification message in.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText);
        })
        .addRoleOption((role) => {
          return role
            .setName("role")
            .setDescription("The role to give the user after they verify.")
            .setRequired(true);
        })
        .addChannelOption((channel) => {
          return channel
            .setName("log_channel")
            .setDescription("The channel to log the verification messages in.")
            .setRequired(true);
        })
        .addStringOption((option) => {
          return option
            .setName("description")
            .setDescription("The description of the verification embed.");
        });
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("verify")
        .setDescription("Verify a user.")
        .addStringOption((string) => {
          return string
            .setName("id")
            .setDescription(
              "The verification id provided in the application embed."
            )
            .setRequired(true);
        });
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("deny")
        .setDescription("Deny a user.")
        .addStringOption((string) => {
          return string
            .setName("id")
            .setDescription(
              "The verification id provided in the application embed."
            )
            .setRequired(true);
        })
        .addStringOption((string) => {
          return string
            .setName("reason")
            .setDescription("The reason for denying the user.")
            .setRequired(true);
        });
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("delete")
        .setDescription("Delete the application schema");
    }),
  /**
   * @param {Client} client
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === "setup") {
      const channel = interaction.options.getChannel("channel");
      const logChannel = interaction.options.getChannel("log_channel");
      const description = interaction.options.getString("description");
      const role = interaction.options.getRole("role");

      const data = await appSchema.findOne({ guildId: interaction.guild.id });

      if (data) {
        return await interaction.reply({
          content: "The application system is already setup!",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Verify")
        .setDescription(
          description || "Click the button below to apply to the server!"
        )
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setEmoji("✅")
          .setLabel("Apply")
          .setStyle(ButtonStyle.Success)
          .setCustomId("apply")
      );

      await channel.send({ embeds: [embed], components: [buttons] });

      await new appSchema({
        _id: Types.ObjectId(),
        guildId: interaction.guild.id,
        channelId: logChannel.id,
        roleId: role.id,
      })
        .save()
        .then(async () => {
          return await interaction.reply({
            content: "Successfully setup the application system!",
            ephemeral: true,
          });
        });
    }

    if (interaction.options.getSubcommand() === "verify") {
      const id = interaction.options.getString("id");
      const data = await userAppSchema.findOne({
        guildId: interaction.guild.id,
      });
      const appData = await appSchema.findOne({
        guildId: interaction.guild.id,
      });

      if (!data)
        return await interaction.reply({
          content: "The application system is not setup!",
          ephemeral: true,
        });
      if (!data._id == id)
        return await interaction.reply({
          content: "That application was not found!",
          ephemeral: true,
        });
      if (!appData.roleId)
        return await interaction.reply({
          content: "The application role is not found!",
          ephemeral: true,
        });

      const role = await interaction.guild.roles.fetch(appData.roleId);
      const channel = await client.channels.fetch(appData.channelId);
      const user = client.users.cache.get(data.userId);
      const member = interaction.guild.members.cache.get(data.userId);

      const embed = new EmbedBuilder()
        .setTitle("Application Verified")
        .setDescription(
          `**User:** ${user.tag} (${
            user.id
          })\n**Status:** Accepted\n**Moderator**: ${interaction.user.tag} (${
            interaction.user.id
          })\n**Time:** ${time()}`
        )
        .setTimestamp()
        .setColor(client.color);

      const embed2 = new EmbedBuilder()
        .setTitle("Your application has been accepted!")
        .setDescription(
          `You have been accepted into ${interaction.guild.name}!`
        )
        .setTimestamp()
        .setColor(client.color);

      await user.send({ embeds: [embed2] });
      await channel.send({ embeds: [embed] });
      await member.roles.add(role);

      await interaction
        .reply({
          content: "Successfully verified the user!",
        })
        .then(async () => {
          await userAppSchema.deleteOne({ _id: id });
        })
        .catch((err) => console.log(err));
    }

    if (interaction.options.getSubcommand() === "deny") {
      const id = interaction.options.getString("id");
      const reason = interaction.options.getString("reason");
      const data = await appSchema.findOne({ guildId: interaction.guild.id });
      const userData = await userAppSchema.findOne({
        guildId: interaction.guild.id,
      });

      if (!data)
        return await interaction.reply({
          content: "The application system is not setup!",
          ephemeral: true,
        });
      if (!userData)
        return await interaction.reply({
          content: "No one has applied to the server yet!",
          ephemeral: true,
        });
      if (!data.channelId)
        return await interaction.reply({
          content: "The application channel is not found!",
          ephemeral: true,
        });
      if (!userData._id == id)
        return await interaction.reply({
          content: "That application was not found!",
          ephemeral: true,
        });
      if (!data.roleId)
        return await interaction.reply({
          content: "The application role is not found!",
          ephemeral: true,
        });

      const channel = await client.channels.fetch(data.channelId);
      const user = client.users.cache.get(userData.userId);

      const userEmbed = new EmbedBuilder()
        .setTitle("Your application has been denied!")
        .setDescription(
          `You have been denied entry to ${interaction.guild.name}!\n****Reason:** \`${reason}\``
        )
        .setTimestamp()
        .setColor(client.color);

      const denyEmbed = new EmbedBuilder()
        .setTitle("Application Denied")
        .setDescription(
          `**User:** ${user.tag} (${
            user.id
          })\n**Status:** Denied\n**Moderator**: ${interaction.user.tag} (${
            interaction.user.id
          })\n**Time:** ${time()}\n**Reason:** \`${reason}\``
        )
        .setTimestamp()
        .setColor(client.color);

      await channel.send({ embeds: [denyEmbed] });

      await interaction
        .reply({
          content: "Successfully denied the application!",
        })
        .then(async () => {
          await userAppSchema.deleteOne({ _id: id });
        })
        .catch((err) => console.log(err));

      await user.send({ embeds: [userEmbed] }).catch(async () => {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                "I was unable to send the user a message, the user may have DMs disabled!"
              )
              .setColor("RED"),
          ],
        });
      });
    }

    if (interaction.options.getSubcommand() === "delete") {
      const data = await appSchema.findOne({
        guildId: interaction.guild.id,
      });

      if (!data)
        return await interaction.reply({
          content: "The application system is not setup!",
          ephemeral: true,
        });

      await client.channels.cache
        .get(data.channelId)
        .send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Application System Deleted")
              .setDescription(
                `The application system has been deleted by ${interaction.user.tag} (${interaction.user.id})!`
              )
              .setTimestamp()
              .setColor(client.color),
          ],
        })
        .catch();

      await interaction.reply({
        content: "Successfully deleted the application system!",
        ephemeral: true,
      });
      return await data.deleteOne({ guildId: interaction.guild.id });
    }
  },
};
