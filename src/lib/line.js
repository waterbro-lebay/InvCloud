import { Client } from "@line/bot-sdk";

const config = {
  channelAccessToken: process.env.NEXT_LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.NEXT_LINE_CHANNEL_SECRET,
};

const lineClient = new Client(config);

export default lineClient;
