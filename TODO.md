# TODOs:

This file lists the current tasks, future features, and known issues.

> [!INFO]
> This file also serves as a seconde brain for me to track what needs to be done. It may contain some entries that are outdated, incomplete, or not relevant to the project. Please take it with a grain of salt.

## Current major features to implement before v1.0.0
- [ ] - WIP - Full rework of the habits configuration and daily entries UI/UX 
- [ ] - Fresh 2.X upgrade (followed by full dependency upgrade)
- [ ] - WIP - Better, and more notificiation channels (using a dedicated notification service to orchestrate them)
- [ ] - I18n / Localization
- [ ] - Conception of a better stats page
- [ ] - Layout of the architecture for the streak/goals system

## UX & UI
- [ ] Create the main app layout
- [x] Add toast
- [x] Fix/Better loader
- [x] Add loader on saving datas
- [ ] Themes
  - [ ] Add premade theme toggle https://daisyui.com/components/theme-controller/
  - [ ] Add main color changer, mainly for the stats
- [ ] Style content
  - [ ] Rating
    - [ ] Add rating number (on hover/inside circles)
- [ ] Style entries
  - [ ] Add icons support
  - [ ] Add form variant
    - [ ] Default (field by field)
    - [ ] by rows
    - [ ] by masonry ?
- [ ] Pages
  - [x] No content on index
  - [x] Hello page
  - [ ] Better signin/out
  - [x] Tell public user 'your are public, warning in x days everything delete'
    - [ ] Make it more clear for public user that data expiry (like with a banner)
  - [x] Landing page
- [ ] Fix icons

## Configuration (Content)
- [x] Add Validation/Sanitize on each content field (name, etc)
- [ ] Add types
  - [ ] Add date picker
  - [x] Add rating (maybe as variant of number)
    - [x] Add rating check for max-min-step
    - [x] Add step
  - [ ] Question entry? Where you answer daily one/ a set of questions
  - [ ] Magneto (audio)
- [x] Add field grouping
- [ ] Rethink the content saving. Check whats the best approach here. Keep only new entries, or update existing ones?
- [ ] Rethink the way of configuring content. Maybe a form like in daily entry, and if click on field it opens a floating same-context modal to edit it.
- [x] Clone content
- [ ] Reorder content
- [x] Cannot change name. Can only add or delete entries if already used
- [x] Cannot save if validation error
- [ ] Delete avant last entry not working (entry index not correct)
- [ ] Add value unit (hour, /per day, etc)
- [ ] Does deleting a config field will impact the entries "linked" to that field ?
- [ ] Add icons in config

## Entries
- [ ] Add validation on each field. Try ssr validation (default html form validation), or using islands if not possible
- [ ] Make them dynamic using previous values
  - [ ] Use previous values 
  - [ ] Propose in dropdown previous/mains values
- [x] Select missing entry selects the date of it

## Settings
- [ ] Daily delta (1 day default)
- [ ] Multi string delimiter (default: '|||')
- [ ] Custom data backups
- [ ] Support [TZ](https://gist.github.com/aviflax/a4093965be1cd008f172?permalink_comment_id4079362#gistcomment-4079362)

## Reminders/Notifications
- [ ] Notifications when/how
- [ ] Test notifications  discord webhook
- [ ] Better onesignal intergation for same account on multiple devices

## Data: Export / Import / Backup
- [ ] Backups/export
  - [ ] Find ways to save the data (gdrive ?)
  - [ ] Add daily/weekly backup cron
  - [x] Add export button
    - [x] Export files (json, csv)
    - [ ] Expand export with additionnal parameters
- [ ] Import
  - [ ] Add import button
  - [ ] Auto import from source

## Auth & Sync
- [x] Add auth
  - [x] Add login
  - [x] Add logout
  - [x] Add register
- [x] Sync
  - [x] When signing, transfer all current public content to the new signed in user
  - [ ] Is sync doable not env dependent (yes, with same db using path)?
- [x] Encode config & content per-user (signed in only?)
- [x] Periodically delete content/config of public users from kv
- [ ] Add a warning on the key page (when connect for first time) if user has not dl/copied key
  - [ ] Change recovery key name to include email
- [ ] There is room for optimization on the handling of the getUser/getUserBySession/getUserKVConfig (less functions, quicker retrieving)

## Admin
- [x] Add an admin account (set in env)
  - [x] Can see created users
  - [ ] Receive notif on created users ?
  - [ ] Check logs ?
  - [ ] Manage entries/content

## Security, Crypto & Abuse Protection
- [ ] Bots are hitting the app. Find a way to secure/block.
- [ ] Crypto
  - [ ] Get an advisor to check the crypto implementation
  - [ ] Secure the session infos on db

## Infrastructure & Deployment
- [ ] Deploy
  - [x] Add image tagging and versioning (maybe app based), so I can reclaim disk space of old images
  - [x] Add cleanup scripts for old version
  - [ ] Check why is it so slow on server
- [ ] Host dbs on server, to easier management (check deno kv rust cargo about the kv server)
- [ ] App base path as env (/app)
  - [ ] Better kv path management
- [ ] Easier deploy
  - [ ] Srcipt run to check env/paths/etc
  - [ ] env example & generator
- [x] Implement releases
  - [x] Changelog
  - [x] Versioning
- [ ] Env-based deploy (prod/dev)
  - [ ] Enable onesignal only on prod

## Stats & Analytics
- [ ] Create stats page
  - [x] Have a view mode, and an edit mode to create a stats "dashboard"
    - [ ] Styling on edit mode (move bricks, resize etc like in Grafana)
  - [x] From-to time range
    - [x] On edit mode it is fixed to like 2 months
    - [x] On view mode global on top of page
  - [ ] On graph inspection, on entry click it should show the full entry (human readable?)
  - [ ] Graphs
    - [x] One-time panel
      - [x] Average FIELD on X time
      - [x] last FIELD
    - [ ] Full graphs
      - [x] Lines/area - for number
          - [ ] Should be able to add multiple fields
      - [x] heatmap - for number/boolean/has string?
      - [ ] bubble? for 3 pers of the day
      - [x] "textarea"
        - [ ] Have sort of a timeline to select the texts from (even sort of a tooltip with content on hover)
- [ ] Add data export on stats, based on time range

## Main additional features
- [ ] Can datas be cleanup automatically, server side ?
- [x] Version/deploy version in the app about
- [ ] Add fake "pricing" page
- [ ] Add Goals
- [ ] Add reminders in field ("specifically remind me every 3 day to fill this field")
- [ ] Offline mode. Is it possible to access page only cached ? Content can still be 'saved', when internet is back it really saves it.
- [ ] Redo the whole config/entries view. Use a drag and drop system to create the entries form, with popover to customize the fields
- [ ] [Localization](https://www.i18next.com/)
- [ ] Store (free of course)
  - [ ] Templates
  - [ ] Themes

## To do before beta release
- [x] Add templating system
  - [x] Add config templates
  - [ ] Add stats templates
- [x] Create a basic db backup system
- [x] Research on a key rotation strategy / admin key management
- [x] Checkout landing page & content on it
  - [x] Set logo to go back to landing page from app
- [x] Check the content on app
- [x] Better release management
  - [x] CLI-based release (or actions if better)
  - [x] Pinned envs
  - [x] Auto changelog
  - [x] Versionnig / Tagging
- [x] Full review of the privacy policy / terms of service

## Bugs
- [x] On main page, the "missed" days seems to be stuck to 5 days. Aftere 5 days they are always considered missing.
- [x] Header layout on mobile / overflow with import/export
- [x] Errors
  - [x] On callback reload `OAuth session not found at getAndDeleteOAuthSession (https://jsr.io/@deno/kv-oauth/0.11.0/lib/_kv.ts:34:11)`
  - [x] Session ended (TTL expired) when signed in (redirect to specific page to re-connect. Do not bother with refresh token)
  - [ ] If the crypto keys change, OperationError: Decryption failed on kv transactions. Maybe add a check before app start ?
- [x] Notificcations
  - [x] Sync CCV - onesignal is pretty bad
  - [x] Cannot save only notification hours: you need to add the discord hook
  - [x] On my local/multiple instances, I have multiple times the same email but I cannot use it
- [x] On account delete, the client crash (also account settings are NOT deleted)
- [ ] Sometimes if you signed in using a single google account, it will auto connect to this account when navigating to /signin. It should always show the Google "choose account" page.
- [ ] If you cancel saving for the day when you already have saved something, you are prompted 2 times and the button stay in loading state