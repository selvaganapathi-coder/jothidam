export type ReminderUser = {
  uid: string;
  lastPickDate?: string;
  settings?: {
    language?: "ta" | "en";
    reminderOptIn?: boolean;
    fcmToken?: string;
  };
};

export type ReminderRecipient = {
  uid: string;
  token: string;
  language: "ta" | "en";
};

export function selectReminderRecipients(
  users: ReminderUser[],
  today: string,
): ReminderRecipient[] {
  return users.flatMap((user) => {
    const settings = user.settings;
    if (
      !settings?.reminderOptIn ||
      !settings.fcmToken ||
      user.lastPickDate === today
    ) {
      return [];
    }

    return [{
      uid: user.uid,
      token: settings.fcmToken,
      language: settings.language === "en" ? "en" : "ta",
    }];
  });
}
