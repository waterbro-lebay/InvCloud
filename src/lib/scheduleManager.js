import schedule from "node-schedule";
import connectDB from "@/lib/mongodb";
import JobSchedule from "@/models/JobSchedule";
import { sendFlexMessageToLine } from "@/lib/lineMessage";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  createInternalPreMeetingNotificationForConfirmFlex,
  createInternalPreMeetingNotificationForMeetAndInternalProcessFlex,
  createActivityNotificationFlex,
} from "@/lib/lineMessage";

// 設定 dayjs 時區插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Taipei");

export async function createScheduleJob({
  jobId,
  type,
  cronTime,
  metadata,
  callback = async () => {},
}) {
  try {
    await connectDB();

    // 檢查 cronTime 是否為過去的時間
    const cronDate = new Date(cronTime);
    if (cronDate < new Date()) {
      console.log(`排程時間 ${cronDate} 已過期，不建立排程`);
      // 直接建立一個已完成狀態的排程記錄
      const scheduleDoc = new JobSchedule({
        jobId,
        type,
        cronTime,
        metadata,
        nextInvocation: null,
        status: "completed", // 已過期的排程直接標記為完成
        lastRunTime: new Date(),
      });
      await scheduleDoc.save();
      return null;
    }

    // 建立排程任務
    const job = schedule.scheduleJob(jobId, cronTime, async () => {
      try {
        await callback();

        // 更新執行狀態為已完成
        await JobSchedule.findOneAndUpdate(
          { jobId },
          {
            lastRunTime: new Date(),
            nextInvocation: job?.nextInvocation() || null,
            status: "completed", // 更新狀態為已完成
          }
        );
      } catch (error) {
        console.error(`排程執行失敗 [${jobId}]:`, error);
        await JobSchedule.findOneAndUpdate(
          { jobId },
          {
            status: "failed",
            error: error.message,
            lastRunTime: new Date(),
          }
        );
      }
    });

    if (!job) {
      console.error(`排程建立失敗 [${jobId}]: 無效的 cronTime`);
      throw new Error("無效的排程時間");
    }

    // jobId 是否存在
    const jobExists = await JobSchedule.findOne({ jobId });
    if (jobExists) {
      // 刪除已存在的排程
      await JobSchedule.deleteOne({ jobId });
    }

    // 儲存到資料庫
    const scheduleDoc = new JobSchedule({
      jobId,
      type,
      cronTime,
      metadata,
      nextInvocation: job?.nextInvocation() || null,
      status: "active", // 初始狀態為執行中
    });

    await scheduleDoc.save();

    return job;
  } catch (error) {
    console.error("建立排程失敗:", error);
    throw error;
  }
}

export async function restoreSchedules() {
  try {
    await connectDB();

    // 獲取所有活躍的排程
    const dbSchedules = await JobSchedule.find({ status: "active" });

    // 重新建立每個排程
    for (const scheduleDoc of dbSchedules) {
      const { jobId, type, cronTime, metadata } = scheduleDoc;

      console.log(`恢復排程: ${jobId}`);
      console.log(`排程時間: ${cronTime}`);
      console.log(`排程類型: ${type}`);
      console.log(`排程 metadata: ${metadata}`);
      // console.log(`metadata: ${metadata["url"]}`);
      // console.log(`metadata: ${metadata["innerPageUrl"]}`);

      // console.log(`metadata: ${typeof metadata}`);

      // 根據不同類型建立對應的回調函數，
      let callback;
      // pre-meeting 回調函數
      if (type === "pre-meeting") {
        callback = async () => {
          try {
            // 發送 flex message: 預約確認通知
            const flexMessage =
              createInternalPreMeetingNotificationForConfirmFlex({
                title: "內部行前會議通知",
                customerName: metadata.customerName,
                date: metadata.date,
                location: metadata.location,
                projectType: metadata.projectType,
                url: metadata.url,
                updatedBy: metadata.updatedBy,
                pageId: metadata.pageId,
              });
            await sendFlexMessageToLine(
              metadata.groupId,
              flexMessage,
              `${metadata.customerName} 內部行前會議通知`
            );
            console.log(`預約確認通知已發送給 LINE`);

            // 更新執行狀態為已完成
            await JobSchedule.findOneAndUpdate(
              { jobId },
              {
                lastRunTime: new Date(),
                nextInvocation: null, // 無需設定 nextInvocation
                status: "completed", // 更新狀態為已完成
              }
            );
          } catch (error) {
            console.error(`pre-meeting 排程執行失敗 [${jobId}]:`, error);
          }
        };
      } else if (type === "pre-meeting-activity") {
        callback = async () => {
          try {
            // 發送 flex message: 預約會議及內部流程通知
            console.log(`metadata: ${metadata}`);
            const flexMessage =
              createInternalPreMeetingNotificationForMeetAndInternalProcessFlex(
                {
                  title: "內部行前會議通知",
                  customerName: metadata.customerName,
                  date: metadata.date,
                  url: metadata.url,
                  innerPageUrl: metadata.innerPageUrl,
                  updatedBy: metadata.updatedBy,
                }
              );
            await sendFlexMessageToLine(
              metadata.groupId,
              flexMessage,
              `${metadata.customerName} 內部行前會議通知`
            );
            console.log(`預約會議及內部流程通知已發送給 LINE`);

            // 更新執行狀態為已完成
            await JobSchedule.findOneAndUpdate(
              { jobId },
              {
                lastRunTime: new Date(),
                nextInvocation: null, // 無需設定 nextInvocation
                status: "completed", // 更新狀態為已完成
              }
            );
          } catch (error) {
            console.error(
              `pre-meeting-activity 排程執行失敗 [${jobId}]:`,
              error
            );
          }
        };
      } else if (type === "activity") {
        callback = async () => {
          try {
            // 發送 flex message: 活動通知
            const flexMessage = createActivityNotificationFlex({
              title: "活動行前通知",
              customerName: metadata.customerName,
              date: metadata.date,
              location: metadata.location,
              projectType: metadata.projectType,
              url: metadata.url,
              updatedBy: metadata.updatedBy,
              pageId: metadata.pageId,
            });
            await sendFlexMessageToLine(
              metadata.groupId,
              flexMessage,
              `${metadata.customerName} 活動行前通知`
            );
            console.log(`活動通知已發送給 LINE`);

            // 更新執行狀態為已完成
            await JobSchedule.findOneAndUpdate(
              { jobId },
              {
                lastRunTime: new Date(),
                nextInvocation: null, // 無需設定 nextInvocation
                status: "completed", // 更新狀態為已完成
              }
            );
          } catch (error) {
            console.error(`activity 排程執行失敗 [${jobId}]:`, error);
          }
        };
      }

      // 如果回調函數存在，則建立排程
      if (callback) {
        console.log(`恢復排程2: ${jobId}`);
        schedule.scheduleJob(jobId, cronTime, callback);
      }
    }

    console.log(
      `已恢復 ${dbSchedules.length} 個排程，時區: ${dayjs.tz.guess()}`
    );
    console.log(
      `系統時間(UTC+8): ${dayjs().tz().format("YYYY-MM-DD HH:mm:ss")}`
    );
  } catch (error) {
    console.error("恢復排程失敗:", error);
  }
}
