// ====== FOR REFERENCE ONLY  Model file, extracted from [react-onesignal](https://github.com/OneSignal/react-onesignal) ======
interface LanguageStringMap {
  /**
   * Text in English.  Will be used as a fallback
   */
  "en"?: string;
  /**
   * Text in Arabic.
   */
  "ar"?: string;
  /**
   * Text in Bosnian.
   */
  "bs"?: string;
  /**
   * Text in Bulgarian.
   */
  "bg"?: string;
  /**
   * Text in Catalan.
   */
  "ca"?: string;
  /**
   * Text in Chinese (Simplified).
   */
  "zh_hans"?: string;
  /**
   * Text in Chinese (Traditional).
   */
  "zh_hant"?: string;
  /**
   * Alias for zh-Hans.
   */
  "zh"?: string;
  /**
   * Text in Croatian.
   */
  "hr"?: string;
  /**
   * Text in Czech.
   */
  "cs"?: string;
  /**
   * Text in Danish.
   */
  "da"?: string;
  /**
   * Text in Dutch.
   */
  "nl"?: string;
  /**
   * Text in Estonian.
   */
  "et"?: string;
  /**
   * Text in Finnish.
   */
  "fi"?: string;
  /**
   * Text in French.
   */
  "fr"?: string;
  /**
   * Text in Georgian.
   */
  "ka"?: string;
  /**
   * Text in German.
   */
  "de"?: string;
  /**
   * Text in Greek.
   */
  "el"?: string;
  /**
   * Text in Hindi.
   */
  "hi"?: string;
  /**
   * Text in Hebrew.
   */
  "he"?: string;
  /**
   * Text in Hungarian.
   */
  "hu"?: string;
  /**
   * Text in Indonesian.
   */
  "id"?: string;
  /**
   * Text in Italian.
   */
  "it"?: string;
  /**
   * Text in Japanese.
   */
  "ja"?: string;
  /**
   * Text in Korean.
   */
  "ko"?: string;
  /**
   * Text in Latvian.
   */
  "lv"?: string;
  /**
   * Text in Lithuanian.
   */
  "lt"?: string;
  /**
   * Text in Malay.
   */
  "ms"?: string;
  /**
   * Text in Norwegian.
   */
  "nb"?: string;
  /**
   * Text in Polish.
   */
  "pl"?: string;
  /**
   * Text in Persian.
   */
  "fa"?: string;
  /**
   * Text in Portugese.
   */
  "pt"?: string;
  /**
   * Text in Punjabi.
   */
  "pa"?: string;
  /**
   * Text in Romanian.
   */
  "ro"?: string;
  /**
   * Text in Russian.
   */
  "ru"?: string;
  /**
   * Text in Serbian.
   */
  "sr"?: string;
  /**
   * Text in Slovak.
   */
  "sk"?: string;
  /**
   * Text in Spanish.
   */
  "es"?: string;
  /**
   * Text in Swedish.
   */
  "sv"?: string;
  /**
   * Text in Thai.
   */
  "th"?: string;
  /**
   * Text in Turkish.
   */
  "tr"?: string;
  /**
   * Text in Ukrainian.
   */
  "uk"?: string;
  /**
   * Text in Vietnamese.
   */
  "vi"?: string;
}

interface Button {
  /**
   * The id of the button. This is used to identify which button was clicked in the notification.
   */
  "id": string;
  /**
   * The text displayed on the button.
   */
  "text": string;
  /**
   * The icon displayed on the button. This can be a URL or a local resource name.
   */
  "icon"?: string;
}

interface WebButton {
  /**
   * The id of the button. This is used to identify which button was clicked in the notification.
   */
  "id": string;
  /**
   * The text displayed on the button.
   */
  "text": string;
  /**
   * The URL that the button will open when clicked.
   */
  "url": string;
}

interface BasicNotificationAllOfAndroidBackgroundLayout {
  /**
   * Asset file, android resource name, or URL to remote image.
   */
  "image"?: string;
  /**
   * Title text color ARGB Hex format. Example(Blue) \"FF0000FF\".
   */
  "headings_color"?: string;
  /**
   * Body text color ARGB Hex format. Example(Red) \"FFFF0000\".
   */
  "contents_color"?: string;
}

interface FilterExpression {
  /**
   * Required. Name of the field to use as the first operand in the filter expression.
   */
  "field"?: string;
  /**
   * If `field` is `tag`, this field is *required* to specify `key` inside the tags.
   */
  "key"?: string;
  /**
   * Constant value to use as the second operand in the filter expression. This value is *required* when the relation operator is a binary operator.
   */
  "value"?: string;
  /**
   * If `field` is session-related, this is *required* to specify the number of hours before or after the user\'s session.
   */
  "hours_ago"?: string;
  /**
   * If `field` is `location`, this will specify the radius in meters from a provided location point. Use with `lat` and `long`.
   */
  "radius"?: number;
  /**
   * If `field` is `location`, this is *required* to specify the user\'s latitude.
   */
  "lat"?: number;
  /**
   * If `field` is `location`, this is *required* to specify the user\'s longitude.
   */
  "long"?: number;
  /**
   * Required. Operator of a filter expression.
   */
  "relation"?: ">" | "<" | "=" | "!=" | "exists" | "not_exists" | "time_elapsed_gt" | "time_elapsed_lt";
  /**
   * Strictly, this must be either `\"OR\"`, or `\"AND\"`.  It can be used to compose Filters as part of a Filters object.
   */
  "operator"?: "OR" | "AND";
}

export interface NotificationBody {
  /**
   * The segment names you want to target. Users in these segments will receive a notification. This targeting parameter is only compatible with excluded_segments. Example: [\"Active Users\", \"Inactive Users\"]
   */
  "included_segments"?: Array<string>;
  /**
   * Segment that will be excluded when sending. Users in these segments will not receive a notification, even if they were included in included_segments. This targeting parameter is only compatible with included_segments. Example: [\"Active Users\", \"Inactive Users\"]
   */
  "excluded_segments"?: Array<string>;
  /**
   * Specific subscription ids to send your notification to. _Does not require API Auth Key._ Not compatible with any other targeting parameters. Example: [\"1dd608f2-c6a1-11e3-851d-000c2940e62c\"] Limit of 2,000 entries per REST API call
   */
  "include_subscription_ids"?: Array<string>;
  /**
   * Recommended for Sending Emails - Target specific email addresses. If an email does not correspond to an existing user, a new user will be created. Example: nick@catfac.ts Limit of 2,000 entries per REST API call
   */
  "include_email_tokens"?: Array<string>;
  /**
   * Recommended for Sending SMS - Target specific phone numbers. The phone number should be in the E.164 format. Phone number should be an existing subscriber on OneSignal. Refer our docs to learn how to add phone numbers to OneSignal. Example phone number: +1999999999 Limit of 2,000 entries per REST API call
   */
  "include_phone_numbers"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using iOS device tokens. Warning: Only works with Production tokens. All non-alphanumeric characters must be removed from each token. If a token does not correspond to an existing user, a new user will be created. Example: ce777617da7f548fe7a9ab6febb56cf39fba6d38203... Limit of 2,000 entries per REST API call
   */
  "include_ios_tokens"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using Windows URIs. If a token does not correspond to an existing user, a new user will be created. Example: http://s.notify.live.net/u/1/bn1/HmQAAACPaLDr-... Limit of 2,000 entries per REST API call
   */
  "include_wp_wns_uris"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using Amazon ADM registration IDs. If a token does not correspond to an existing user, a new user will be created. Example: amzn1.adm-registration.v1.XpvSSUk0Rc3hTVVV... Limit of 2,000 entries per REST API call
   */
  "include_amazon_reg_ids"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using Chrome App registration IDs. If a token does not correspond to an existing user, a new user will be created. Example: APA91bEeiUeSukAAUdnw3O2RB45FWlSpgJ7Ji_... Limit of 2,000 entries per REST API call
   */
  "include_chrome_reg_ids"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using Chrome Web Push registration IDs. If a token does not correspond to an existing user, a new user will be created. Example: APA91bEeiUeSukAAUdnw3O2RB45FWlSpgJ7Ji_... Limit of 2,000 entries per REST API call
   */
  "include_chrome_web_reg_ids"?: Array<string>;
  /**
   * Not Recommended: Please consider using include_subscription_ids or include_aliases instead. Target using Android device registration IDs. If a token does not correspond to an existing user, a new user will be created. Example: APA91bEeiUeSukAAUdnw3O2RB45FWlSpgJ7Ji_... Limit of 2,000 entries per REST API call
   */
  "include_android_reg_ids"?: Array<string>;
  /**
   * Target specific users by aliases assigned via API. An alias can be an external_id, onesignal_id, or a custom alias. Accepts an object where keys are alias labels and values are arrays of alias IDs to include Example usage: { \"external_id\": [\"exId1\", \"extId2\"], \"internal_label\": [\"id1\", \"id2\"] } Not compatible with any other targeting parameters. REQUIRED: REST API Key Authentication Limit of 2,000 entries per REST API call Note: If targeting push, email, or sms subscribers with same ids, use with target_channel to indicate you are sending a push or email or sms.
   */
  "include_aliases"?: { [key: string]: Array<string> };
  "email_to"?: string[];
  "email_reply_to_address"?: string;
  "target_channel"?: NotificationTargetChannelEnum;
  "id"?: string;
  "value"?: number;
  /**
   * Required for SMS Messages. An identifier for tracking message within the OneSignal dashboard or export analytics. Not shown to end user.
   */
  "name"?: string;
  "aggregation"?: NotificationAggregationEnum;
  /**
   * Indicates whether to send to all devices registered under your app\'s Apple iOS platform.
   */
  "is_ios"?: boolean;
  /**
   * Indicates whether to send to all devices registered under your app\'s Google Android platform.
   */
  "is_android"?: boolean;
  /**
   * Indicates whether to send to all devices registered under your app\'s Huawei Android platform.
   */
  "is_huawei"?: boolean;
  /**
   * Indicates whether to send to all subscribed web browser users, including Chrome, Firefox, and Safari. You may use this instead as a combined flag instead of separately enabling isChromeWeb, isFirefox, and isSafari, though the three options are equivalent to this one.
   */
  "is_any_web"?: boolean;
  /**
   * Indicates whether to send to all Google Chrome, Chrome on Android, and Mozilla Firefox users registered under your Chrome & Firefox web push platform.
   */
  "is_chrome_web"?: boolean;
  /**
   * Indicates whether to send to all Mozilla Firefox desktop users registered under your Firefox web push platform.
   */
  "is_firefox"?: boolean;
  /**
   * Does not support iOS Safari. Indicates whether to send to all Apple\'s Safari desktop users registered under your Safari web push platform. Read more iOS Safari
   */
  "is_safari"?: boolean;
  /**
   * Indicates whether to send to all devices registered under your app\'s Windows platform.
   */
  "is_wp_wns"?: boolean;
  /**
   * Indicates whether to send to all devices registered under your app\'s Amazon Fire platform.
   */
  "is_adm"?: boolean;
  /**
   * This flag is not used for web push Please see isChromeWeb for sending to web push users. This flag only applies to Google Chrome Apps & Extensions. Indicates whether to send to all devices registered under your app\'s Google Chrome Apps & Extension platform.
   */
  "is_chrome"?: boolean;
  /**
   * Required: Your OneSignal Application ID, which can be found in Keys & IDs. It is a UUID and looks similar to 8250eaf6-1a58-489e-b136-7c74a864b434.
   */
  "app_id": string;
  /**
   * [DEPRECATED] Correlation and idempotency key. A request received with this parameter will first look for another notification with the same external_id. If one exists, a notification will not be sent, and result of the previous operation will instead be returned. Therefore, if you plan on using this feature, it\'s important to use a good source of randomness to generate the UUID passed here. This key is only idempotent for 30 days. After 30 days, the notification could be removed from our system and a notification with the same external_id will be sent again.   See Idempotent Notification Requests for more details writeOnly: true
   */
  "external_id"?: string;
  /**
   * Correlation and idempotency key. A request received with this parameter will first look for another notification with the same idempotency key. If one exists, a notification will not be sent, and result of the previous operation will instead be returned. Therefore, if you plan on using this feature, it\'s important to use a good source of randomness to generate the UUID passed here. This key is only idempotent for 30 days. After 30 days, the notification could be removed from our system and a notification with the same idempotency key will be sent again.   See Idempotent Notification Requests for more details writeOnly: true
   */
  "idempotency_key"?: string;
  "contents"?: LanguageStringMap;
  "headings"?: LanguageStringMap;
  "subtitle"?: LanguageStringMap;
  /**
   * Channel: Push Notifications Platform: Huawei A custom map of data that is passed back to your app. Same as using Additional Data within the dashboard. Can use up to 2048 bytes of data. Example: {\"abc\": 123, \"foo\": \"bar\", \"event_performed\": true, \"amount\": 12.1}
   */
  "data"?: object;
  /**
   * Channel: Push Notifications Platform: Huawei Use \"data\" or \"message\" depending on the type of notification you are sending. More details in Data & Background Notifications.
   */
  "huawei_msg_type"?: string;
  /**
   * Channel: Push Notifications Platform: All The URL to open in the browser when a user clicks on the notification. Note: iOS needs https or updated NSAppTransportSecurity in plist This field supports inline substitutions. Omit if including web_url or app_url Example: https://onesignal.com
   */
  "url"?: string;
  /**
   * Channel: Push Notifications Platform: All Browsers Same as url but only sent to web push platforms. Including Chrome, Firefox, Safari, Opera, etc. Example: https://onesignal.com
   */
  "web_url"?: string;
  /**
   * Channel: Push Notifications Platform: All Browsers Same as url but only sent to web push platforms. Including iOS, Android, macOS, Windows, ChromeApps, etc. Example: https://onesignal.com
   */
  "app_url"?: string;
  /**
   * Channel: Push Notifications Platform: iOS 10+ Adds media attachments to notifications. Set as JSON object, key as a media id of your choice and the value as a valid local filename or URL. User must press and hold on the notification to view. Do not set mutable_content to download attachments. The OneSignal SDK does this automatically Example: {\"id1\": \"https://domain.com/image.jpg\"}
   */
  "ios_attachments"?: object;
  /**
   * Channel: Push Notifications Platform: All Use a template you setup on our dashboard. The template_id is the UUID found in the URL when viewing a template on our dashboard. Example: be4a8044-bbd6-11e4-a581-000c2940e62c
   */
  "template_id"?: string;
  /**
   * Channel: Push Notifications Platform: iOS Sending true wakes your app from background to run custom native code (Apple interprets this as content-available=1). Note: Not applicable if the app is in the \"force-quit\" state (i.e app was swiped away). Omit the contents field to prevent displaying a visible notification.
   */
  "content_available"?: boolean;
  /**
   * Channel: Push Notifications Platform: iOS 10+ Always defaults to true and cannot be turned off. Allows tracking of notification receives and changing of the notification content in your app before it is displayed. Triggers didReceive(_:withContentHandler:) on your UNNotificationServiceExtension.
   */
  "mutable_content"?: boolean;
  /**
   * Channel: Push Notifications Platform: iOS 13+ Use to target a specific experience in your App Clip, or to target your notification to a specific window in a multi-scene App.
   */
  "target_content_identifier"?: string;
  /**
   * Channel: Push Notifications Platform: Android Picture to display in the expanded view. Can be a drawable resource name or a URL.
   */
  "big_picture"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei Picture to display in the expanded view. Can be a drawable resource name or a URL.
   */
  "huawei_big_picture"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon Picture to display in the expanded view. Can be a drawable resource name or a URL.
   */
  "adm_big_picture"?: string;
  /**
   * Channel: Push Notifications Platform: ChromeApp Large picture to display below the notification text. Must be a local URL.
   */
  "chrome_big_picture"?: string;
  /**
   * Channel: Push Notifications Platform: Chrome 56+ Sets the web push notification\'s large image to be shown below the notification\'s title and text. Please see Web Push Notification Icons.
   */
  "chrome_web_image"?: string;
  /**
   * Channel: Push Notifications Platform: iOS 8.0+, Android 4.1+, and derivatives like Amazon Buttons to add to the notification. Icon only works for Android. Buttons show in reverse order of array position i.e. Last item in array shows as first button on device. Example: [{\"id\": \"id2\", \"text\": \"second button\", \"icon\": \"ic_menu_share\"}, {\"id\": \"id1\", \"text\": \"first button\", \"icon\": \"ic_menu_send\"}]
   */
  "buttons"?: Array<Button>;
  /**
   * Channel: Push Notifications Platform: Chrome 48+ Add action buttons to the notification. The id field is required. Example: [{\"id\": \"like-button\", \"text\": \"Like\", \"icon\": \"http://i.imgur.com/N8SN8ZS.png\", \"url\": \"https://yoursite.com\"}, {\"id\": \"read-more-button\", \"text\": \"Read more\", \"icon\": \"http://i.imgur.com/MIxJp1L.png\", \"url\": \"https://yoursite.com\"}]
   */
  "web_buttons"?: Array<WebButton>;
  /**
   * Channel: Push Notifications Platform: iOS Category APS payload, use with registerUserNotificationSettings:categories in your Objective-C / Swift code. Example: calendar category which contains actions like accept and decline iOS 10+ This will trigger your UNNotificationContentExtension whose ID matches this category.
   */
  "ios_category"?: string;
  /**
   * Channel: Push Notifications Platform: Android The Android Oreo Notification Category to send the notification under. See the Category documentation on creating one and getting it\'s id.
   */
  "android_channel_id"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei The Android Oreo Notification Category to send the notification under. See the Category documentation on creating one and getting it\'s id.
   */
  "huawei_channel_id"?: string;
  /**
   * Channel: Push Notifications Platform: Android Use this if you have client side Android Oreo Channels you have already defined in your app with code.
   */
  "existing_android_channel_id"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei Use this if you have client side Android Oreo Channels you have already defined in your app with code.
   */
  "huawei_existing_channel_id"?: string;
  "android_background_layout"?: BasicNotificationAllOfAndroidBackgroundLayout;
  /**
   * Channel: Push Notifications Platform: Android Icon shown in the status bar and on the top left of the notification. If not set a bell icon will be used or ic_stat_onesignal_default if you have set this resource name. See: How to create small icons
   */
  "small_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei Icon shown in the status bar and on the top left of the notification. Use an Android resource path (E.g. /drawable/small_icon). Defaults to your app icon if not set.
   */
  "huawei_small_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Android Can be a drawable resource name or a URL. See: How to create large icons
   */
  "large_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei Can be a drawable resource name or a URL. See: How to create large icons
   */
  "huawei_large_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon If not set a bell icon will be used or ic_stat_onesignal_default if you have set this resource name. See: How to create small icons
   */
  "adm_small_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon If blank the small_icon is used. Can be a drawable resource name or a URL. See: How to create large icons
   */
  "adm_large_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Chrome Sets the web push notification\'s icon. An image URL linking to a valid image. Common image types are supported; GIF will not animate. We recommend 256x256 (at least 80x80) to display well on high DPI devices. Firefox will also use this icon, unless you specify firefox_icon.
   */
  "chrome_web_icon"?: string;
  /**
   * Channel: Push Notifications Platform: Chrome Sets the web push notification icon for Android devices in the notification shade. Please see Web Push Notification Badge.
   */
  "chrome_web_badge"?: string;
  /**
   * Channel: Push Notifications Platform: Firefox Not recommended Few people need to set Firefox-specific icons. We recommend setting chrome_web_icon instead, which Firefox will also use. Sets the web push notification\'s icon for Firefox. An image URL linking to a valid image. Common image types are supported; GIF will not animate. We recommend 256x256 (at least 80x80) to display well on high DPI devices.
   */
  "firefox_icon"?: string;
  /**
   * Channel: Push Notifications Platform: ChromeApp This flag is not used for web push For web push, please see chrome_web_icon instead. The local URL to an icon to use. If blank, the app icon will be used.
   */
  "chrome_icon"?: string;
  /**
   * Channel: Push Notifications Platform: iOS Sound file that is included in your app to play instead of the default device notification sound. Pass nil to disable vibration and sound for the notification. Example: \"notification.wav\"
   */
  "ios_sound"?: string;
  /**
   * Channel: Push Notifications Platform: Android &#9888;&#65039;Deprecated, this field doesn\'t work on Android 8 (Oreo) and newer devices! Please use Notification Categories / Channels noted above instead to support ALL versions of Android. Sound file that is included in your app to play instead of the default device notification sound. Pass nil to disable sound for the notification. NOTE: Leave off file extension for Android. Example: \"notification\"
   */
  "android_sound"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei &#9888;&#65039;Deprecated, this field ONLY works on EMUI 5 (Android 7 based) and older devices. Please also set Notification Categories / Channels noted above to support EMUI 8 (Android 8 based) devices. Sound file that is included in your app to play instead of the default device notification sound. NOTE: Leave off file extension for and include the full path.  Example: \"/res/raw/notification\"
   */
  "huawei_sound"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon &#9888;&#65039;Deprecated, this field doesn\'t work on Android 8 (Oreo) and newer devices! Please use Notification Categories / Channels noted above instead to support ALL versions of Android. Sound file that is included in your app to play instead of the default device notification sound. Pass nil to disable sound for the notification. NOTE: Leave off file extension for Android. Example: \"notification\"
   */
  "adm_sound"?: string;
  /**
   * Channel: Push Notifications Platform: Windows Sound file that is included in your app to play instead of the default device notification sound. Example: \"notification.wav\"
   */
  "wp_wns_sound"?: string;
  /**
   * Channel: Push Notifications Platform: Android &#9888;&#65039;Deprecated, this field doesn\'t work on Android 8 (Oreo) and newer devices! Please use Notification Categories / Channels noted above instead to support ALL versions of Android. Sets the devices LED notification light if the device has one. ARGB Hex format. Example(Blue): \"FF0000FF\"
   */
  "android_led_color"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei &#9888;&#65039;Deprecated, this field ONLY works on EMUI 5 (Android 7 based) and older devices. Please also set Notification Categories / Channels noted above to support EMUI 8 (Android 8 based) devices. Sets the devices LED notification light if the device has one. RGB Hex format. Example(Blue): \"0000FF\"
   */
  "huawei_led_color"?: string;
  /**
   * Channel: Push Notifications Platform: Android Sets the background color of the notification circle to the left of the notification text. Only applies to apps targeting Android API level 21+ on Android 5.0+ devices. Example(Red): \"FFFF0000\"
   */
  "android_accent_color"?: string;
  /**
   * Channel: Push Notifications Platform: Huawei Accent Color used on Action Buttons and Group overflow count. Uses RGB Hex value (E.g. #9900FF). Defaults to device\'s theme color if not set.
   */
  "huawei_accent_color"?: string;
  /**
   * Channel: Push Notifications Platform: Android 5.0_ &#9888;&#65039;Deprecated, this field doesn\'t work on Android 8 (Oreo) and newer devices! Please use Notification Categories / Channels noted above instead to support ALL versions of Android. 1 = Public (default) (Shows the full message on the lock screen unless the user has disabled all notifications from showing on the lock screen. Please consider the user and mark private if the contents are.) 0 = Private (Hides message contents on lock screen if the user set \"Hide sensitive notification content\" in the system settings) -1 = Secret (Notification does not show on the lock screen at all)
   */
  "android_visibility"?: number;
  /**
   * Channel: Push Notifications Platform: Huawei &#9888;&#65039;Deprecated, this field ONLY works on EMUI 5 (Android 7 based) and older devices. Please also set Notification Categories / Channels noted above to support EMUI 8 (Android 8 based) devices. 1 = Public (default) (Shows the full message on the lock screen unless the user has disabled all notifications from showing on the lock screen. Please consider the user and mark private if the contents are.) 0 = Private (Hides message contents on lock screen if the user set \"Hide sensitive notification content\" in the system settings) -1 = Secret (Notification does not show on the lock screen at all)
   */
  "huawei_visibility"?: number;
  /**
   * Channel: Push Notifications Platform: iOS Describes whether to set or increase/decrease your app\'s iOS badge count by the ios_badgeCount specified count. Can specify None, SetTo, or Increase. `None` leaves the count unaffected. `SetTo` directly sets the badge count to the number specified in ios_badgeCount. `Increase` adds the number specified in ios_badgeCount to the total. Use a negative number to decrease the badge count.
   */
  "ios_badge_type"?: string;
  /**
   * Channel: Push Notifications Platform: iOS Used with ios_badgeType, describes the value to set or amount to increase/decrease your app\'s iOS badge count by. You can use a negative number to decrease the badge count when used with an ios_badgeType of Increase.
   */
  "ios_badge_count"?: number;
  /**
   * Channel: Push Notifications Platform: iOS 10+, Android Only one notification with the same id will be shown on the device. Use the same id to update an existing notification instead of showing a new one. Limit of 64 characters.
   */
  "collapse_id"?: string;
  /**
   * Channel: Push Notifications Platform: All Browsers Display multiple notifications at once with different topics.
   */
  "web_push_topic"?: string;
  /**
   * Channel: Push Notifications Platform: iOS 10+ iOS can localize push notification messages on the client using special parameters such as loc-key. When using the Create Notification endpoint, you must include these parameters inside of a field called apns_alert. Please see Apple\'s guide on localizing push notifications to learn more.
   */
  "apns_alert"?: object;
  /**
   * Channel: All Possible values are: timezone (Deliver at a specific time-of-day in each users own timezone) last-active Same as Intelligent Delivery . (Deliver at the same time of day as each user last used your app). If send_after is used, this takes effect after the send_after time has elapsed.
   */
  "delayed_option"?: string;
  /**
   * Channel: All Use with delayed_option=timezone. Examples: \"9:00AM\" \"21:45\" \"9:45:30\"
   */
  "delivery_time_of_day"?: string;
  /**
   * Channel: Push Notifications Platform: iOS, Android, Chrome, Firefox, Safari, ChromeWeb Time To Live - In seconds. The notification will be expired if the device does not come back online within this time. The default is 259,200 seconds (3 days). Max value to set is 2419200 seconds (28 days).
   */
  "ttl"?: number;
  /**
   * Channel: Push Notifications Platform: Android, Chrome, ChromeWeb Delivery priority through the push server (example GCM/FCM). Pass 10 for high priority or any other integer for normal priority. Defaults to normal priority for Android and high for iOS. For Android 6.0+ devices setting priority to high will wake the device out of doze mode.
   */
  "priority"?: number;
  /**
   * Channel: Push Notifications Platform: iOS valid values: voip Set the value to voip for sending VoIP Notifications This field maps to the APNS header apns-push-type. Note: alert and background are automatically set by OneSignal
   */
  "apns_push_type_override"?: string;
  /**
   * Channel: All Apps with throttling enabled:   - the parameter value will be used to override the default application throttling value set from the dashboard settings.   - parameter value 0 indicates not to apply throttling to the notification.   - if the parameter is not passed then the default app throttling value will be applied to the notification. Apps with throttling disabled:   - this parameter can be used to throttle delivery for the notification even though throttling is not enabled at the application level. Refer to throttling for more details.
   */
  "throttle_rate_per_minute"?: string;
  /**
   * Channel: Push Notifications Platform: Android Notifications with the same group will be stacked together using Android\'s Notification Grouping feature.
   */
  "android_group"?: string;
  /**
   * Channel: Push Notifications Platform: Android Note: This only works for Android 6 and older. Android 7+ allows full expansion of all message. Summary message to display when 2+ notifications are stacked together. Default is \"# new messages\". Include $[notif_count] in your message and it will be replaced with the current number. Languages - The value of each key is the message that will be sent to users for that language. \"en\" (English) is required. The key of each hash is either a a 2 character language code or one of zh-Hans/zh-Hant for Simplified or Traditional Chinese. Read more: supported languages. Example: {\"en\": \"You have $[notif_count] new messages\"}
   */
  "android_group_message"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon Notifications with the same group will be stacked together using Android\'s Notification Grouping feature.
   */
  "adm_group"?: string;
  /**
   * Channel: Push Notifications Platform: Amazon Summary message to display when 2+ notifications are stacked together. Default is \"# new messages\". Include $[notif_count] in your message and it will be replaced with the current number. \"en\" (English) is required. The key of each hash is either a a 2 character language code or one of zh-Hans/zh-Hant for Simplified or Traditional Chinese. The value of each key is the message that will be sent to users for that language. Example: {\"en\": \"You have $[notif_count] new messages\"}
   */
  "adm_group_message"?: object;
  /**
   * Channel: Push Notifications Platform: iOS 12+ This parameter is supported in iOS 12 and above. It allows you to group related notifications together. If two notifications have the same thread-id, they will both be added to the same group.
   */
  "thread_id"?: string;
  /**
   * Channel: Push Notifications Platform: iOS 12+ When using thread_id to create grouped notifications in iOS 12+, you can also control the summary. For example, a grouped notification can say \"12 more notifications from John Doe\". The summary_arg lets you set the name of the person/thing the notifications are coming from, and will show up as \"X more notifications from summary_arg\"
   */
  "summary_arg"?: string;
  /**
   * Channel: Push Notifications Platform: iOS 12+ When using thread_id, you can also control the count of the number of notifications in the group. For example, if the group already has 12 notifications, and you send a new notification with summary_arg_count = 2, the new total will be 14 and the summary will be \"14 more notifications from summary_arg\"
   */
  "summary_arg_count"?: number;
  /**
   * Channel: Push Notifications Platform: iOS 15+ A score to be set per notification to indicate how it should be displayed when grouped. Use a float between 0-1.
   */
  "ios_relevance_score"?: number;
  /**
   * Channel: Push Notifications Platform: iOS 15+ Focus Modes and Interruption Levels indicate the priority and delivery timing of a notification, to \"interrupt\" the user. Can choose from options: [\'active\', \'passive\', \'time_sensitive\', \'critical\']. Default is active.
   */
  "ios_interruption_level"?: string;
  /**
   * Channel: Email Required.  The subject of the email.
   */
  "email_subject"?: string;
  /**
   * Channel: Email Required unless template_id is set. HTML suported The body of the email you wish to send. Typically, customers include their own HTML templates here. Must include [unsubscribe_url] in an <a> tag somewhere in the email. Note: any malformed HTML content will be sent to users. Please double-check your HTML is valid.
   */
  "email_body"?: string;
  /**
   * Channel: Email The name the email is from. If not specified, will default to \"from name\" set in the OneSignal Dashboard Email Settings.
   */
  "email_from_name"?: string;
  /**
   * Channel: Email The email address the email is from. If not specified, will default to \"from email\" set in the OneSignal Dashboard Email Settings.
   */
  "email_from_address"?: string;
  /**
   * Channel: Email The preheader text of the email. Preheader is the preview text displayed immediately after an email subject that provides additional context about the email content. If not specified, will default to null.
   */
  "email_preheader"?: string;
  /**
   * Channel: Email Default is `false`. If set to `true`, the URLs sent within the email will not include link tracking and will be the same as originally set; otherwise, all the URLs in the email will be tracked.
   */
  "disable_email_click_tracking"?: boolean;
  /**
   * Channel: Email Default is `false`. This field is used to send transactional notifications. If set to `true`, this notification will also be sent to unsubscribed emails. If a `template_id` is provided, the `include_unsubscribed` value from the template will be inherited. If you are using a third-party ESP, this field requires the ESP\'s list of unsubscribed emails to be cleared.
   */
  "include_unsubscribed"?: boolean;
  /**
   * Channel: SMS Phone Number used to send SMS. Should be a registered Twilio phone number in E.164 format.
   */
  "sms_from"?: string;
  /**
   * Channel: SMS URLs for the media files to be attached to the SMS content. Limit: 10 media urls with a total max. size of 5MBs.
   */
  "sms_media_urls"?: Array<string>;
  "filters"?: Array<FilterExpression>;
  /**
   * Channel: All JSON object that can be used as a source of message personalization data for fields that support tag variable substitution. Push, SMS: Can accept up to 2048 bytes of valid JSON. Email: Can accept up to 10000 bytes of valid JSON. Example: {\"order_id\": 123, \"currency\": \"USD\", \"amount\": 25}
   */
  "custom_data"?: object;
  /**
   * Channel: All Schedule notification for future delivery. API defaults to UTC -1100 Examples: All examples are the exact same date & time. \"Thu Sep 24 2015 14:00:00 GMT-0700 (PDT)\" \"September 24th 2015, 2:00:00 pm UTC-07:00\" \"2015-09-24 14:00:00 GMT-0700\" \"Sept 24 2015 14:00:00 GMT-0700\" \"Thu Sep 24 2015 14:00:00 GMT-0700 (Pacific Daylight Time)\" Note: SMS currently only supports send_after parameter.
   */
  "send_after"?: string;
}

export interface CreateNotificationSuccessResponse {
  "id"?: string;
  "external_id"?: string;
  /**
   * Errors include the identifiers that are invalid, or that there are no subscribers.
   */
  "errors"?: any;
}

export type NotificationTargetChannelEnum = "push" | "email" | "sms";
export type NotificationAggregationEnum = "sum" | "count";
