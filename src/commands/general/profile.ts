import CommandInt from "@Interfaces/CommandInt";
import ProfileModel, { ProfileModelInt } from "@Models/ProfileModel";
import { MessageEmbed } from "discord.js";

const generateProfile = (data: ProfileModelInt): MessageEmbed => {
  const embed = new MessageEmbed()
    .setTitle(`${data.username}'s Profile`)
    .setDescription(`Here are the links I have for <@!${data.userId}>:`);
  data.profiles.forEach((prof) => {
    embed.addField(prof.website, prof.url);
  });
  return embed;
};

const profileWebsites = [
  "facebook",
  "linkedin",
  "twitter",
  "instagram",
  "tumblr",
  "steam",
  "github",
  "twitch",
  "youtube",
];

const profile: CommandInt = {
  name: "profile",
  description:
    "Returns an embed containing the user's stored profile data. Optionally get <?user>'s profile, or optionally add <?url> to your data for <?website>",
  parameters: [
    "`<?website>`: name of the website to add",
    "`<?url>`: URL to add for website, or `remove` to delete the website",
    "`<?user>`: username or ID of the user to find",
  ],
  run: async (message) => {
    try {
      const { author, Becca, channel, commandArguments } = message;
      const target = message.mentions.users.first();

      // Mentioned a user
      if (target) {
        const data = await ProfileModel.findOne({
          userId: target.id,
        });
        if (!data) {
          await channel.send(
            `I am so sorry, but <@!${target.id}> does not have a profile set up yet.`
          );
          await message.react(message.Becca.no);
          return;
        }
        const profileEmbed = generateProfile(data);
        profileEmbed.setColor(Becca.color);
        await channel.send(profileEmbed);
        await message.react(message.Becca.yes);
        return;
      }

      // Get the next argument as the website.
      const website = commandArguments.shift();

      // No arguments
      if (!website) {
        const data = await ProfileModel.findOne({ userId: author.id });
        if (!data) {
          await channel.send(
            "I am so sorry, but you have not set your profile up yet."
          );
          await message.react(message.Becca.no);
          return;
        }
        const profileEmbed = generateProfile(data);
        profileEmbed.setColor(Becca.color);
        await channel.send(profileEmbed);
        await message.react(message.Becca.yes);
        return;
      }

      if (!profileWebsites.includes(website.toLowerCase())) {
        await message.reply(
          `${website} is not a supported website to add. I can currently add: ${profileWebsites.join(
            "-"
          )}`
        );
        await message.react(message.Becca.no);
        return;
      }

      const url = commandArguments.shift();
      if (!url) {
        await message.reply(
          `Would you please try the command again, and provide the URL you would like me to add for your ${website}?`
        );
        await message.react(message.Becca.no);
        return;
      }
      if (url === "remove") {
        const data = await ProfileModel.findOne({ userId: author.id });
        if (!data) {
          await message.reply(
            "I am so sorry, but you do not have a profile set up yet."
          );
          await message.react(message.Becca.no);
          return;
        }
        const target = data.profiles.findIndex((el) => el.website === website);
        data.profiles.splice(target, 1);
        await data.save();
        await channel.send(
          `Okay, I have removed ${website} from your profile. Here is what you have now:`
        );
        await channel.send(generateProfile(data).setColor(Becca.color));
        await message.react(message.Becca.yes);
        return;
      }
      if (!url.startsWith("http")) {
        await message.reply(
          `${url} is not a valid URL format. Would you please try the command again?`
        );
        await message.react(message.Becca.no);
        return;
      }
      let addData = await ProfileModel.findOne({ userId: author.id });
      if (!addData) {
        addData = await ProfileModel.create({
          userId: author.id,
          username: author.username,
          profiles: [],
        });
      }
      if (addData.profiles.length >= 25) {
        await message.reply(
          "I am so sorry, but you have the maximum number of profiles."
        );
        await message.react(message.Becca.no);
        return;
      }
      addData.profiles.push({ website, url });
      await addData.save();
      await message.reply(
        `Okay, I have set your ${website} to <${url}>. Here is your profile:`
      );
      await channel.send(generateProfile(addData).setColor(Becca.color));
      await message.react(message.Becca.yes);
    } catch (error) {
      await message.react(message.Becca.no);
      if (message.Becca.debugHook) {
        message.Becca.debugHook.send(
          `${message.guild?.name} had an error with the profile command. Please check the logs.`
        );
      }
      console.log(
        `${message.guild?.name} had the following error with the profile command:`
      );
      console.log(error);
      message.reply("I am so sorry, but I cannot do that at the moment.");
    }
  },
};

export default profile;
