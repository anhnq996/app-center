Create a complete responsive React frontend for an App Download Management website.

This is FRONTEND ONLY.

Do not build backend, database, authentication API, real file upload storage, or server logic.

Use mock data and local React state only.

The application has 2 main areas:

1. Admin UI
2. Public App Download Page

The design should be modern, clean, minimal, premium, and simple to use.

Use:

* React
* TypeScript if supported
* Tailwind CSS
* Modern reusable components
* Lucide icons or similar
* Responsive layout

Do not make the UI look like a complicated enterprise ERP.

---

# 1. ADMIN LOGIN PAGE

Create route/page:

/admin/login

Layout:

* Full screen
* Light neutral background
* Login card centered vertically and horizontally
* Card width around 380–420px
* Rounded corners around 16–20px
* Soft shadow
* Generous spacing

Content:

* Small product/company logo
* Title: "Admin Login"
* Subtitle: "Sign in to manage your app download pages"

Fields:

* Email
* Password
* Remember me checkbox
* Login button

Optional:

* Show/hide password icon

Login does not need real authentication.

When clicking Login, navigate to the Projects page.

---

# 2. ADMIN LAYOUT

Create a reusable Admin Layout.

Desktop:

* Left sidebar
* Main content area

Mobile:

* Sidebar becomes drawer

Sidebar items:

* Projects
* Account
* Logout

Brand area at top:

* Small logo
* Text: "App Downloads"

Use a clean minimal admin style.

Suggested colors:

* Main page background: #F8FAFC
* Cards: white
* Border: #E2E8F0
* Text: dark navy / slate
* Primary accent: blue or indigo

Do not overuse colors.

---

# 3. PROJECT LIST PAGE

Create page:

/admin/projects

Header:

Title:
Projects

Subtitle:
Manage your app download pages.

Right side button:

* Create Project

Below header:

Search input:
"Search projects..."

Project cards or table.

Prefer modern cards on mobile and a clean table/card hybrid on desktop.

Each project should show:

* Project logo
* Project name
* Company name
* Public URL
* Status badge
* Last updated

Example:

Gosang Mobile
Gosang Corp
/download/gosang-mobile
Active

Actions:

* Edit
* Preview
* Copy Link
* Delete

Use icon buttons where appropriate.

Create at least 3 mock projects to make the UI realistic.

---

# 4. CREATE / EDIT PROJECT PAGE

Create page:

/admin/projects/new

and edit mode page:

/admin/projects/:id

Use the same form UI for both.

At the top:

Breadcrumb:
Projects / Edit Project

Title:
Edit Project

Buttons:

* Preview
* Save Changes

Use tabs:

General
Appearance
Download Buttons

---

# 5. GENERAL TAB

Create a clean form inside cards.

Section:

Project Information

Fields:

Project Name
Example:
Gosang Mobile

Company Name
Example:
Gosang Corp

Public Slug
Example:
gosang-mobile

Show helper text:

Public page:
/download/gosang-mobile

Status:

* Active
* Inactive

Use toggle or select.

---

# 6. PROJECT LOGO

Create upload UI for Project Logo.

Display:

* Current logo preview
* Upload button
* Replace button
* Remove button

This is UI only.

When user selects/upload image, simulate preview using local browser state if possible.

Recommended logo preview:
100x100px
rounded 20px

---

# 7. COMPANY LOGO

Create another upload UI:

Company Logo

Show:

* Logo preview
* Upload/Replace button
* Remove

Also add toggle:

Show company name on download page

---

# 8. APPEARANCE TAB

This tab configures the public download page appearance.

Create a visual settings card.

Background Type:

Use segmented controls or cards:

* Solid Color
* Gradient
* Background Image

---

# 9. SOLID COLOR

When Solid Color is selected:

Show:

Background Color

Include:

* color picker
* hex input

Example:
#0F172A

---

# 10. GRADIENT

When Gradient is selected:

Show:

Color 1
Color 2

Gradient Direction:

Dropdown:

* Top to Bottom
* Left to Right
* Top Left to Bottom Right
* Top Right to Bottom Left

Show a small gradient preview box.

---

# 11. BACKGROUND IMAGE

When Background Image is selected:

Create upload area.

Show:

* Drag and drop area
* Image preview
* Replace Image
* Remove Image

Add:

Overlay Strength

Use slider:
0% – 80%

Show current value.

---

# 12. TEXT STYLE SETTINGS

Create section:

Content Style

Options:

Text Theme:

* Auto
* Light
* Dark

Download Card Style:

* Solid
* Glass
* Transparent

Card Radius:

* Small
* Medium
* Large

Keep controls visually simple.

---

# 13. DOWNLOAD BUTTONS TAB

This is the most important admin section.

Show heading:

Download Buttons

Subtitle:
Manage the platforms available on your public download page.

Default items:

Android
iOS

Android and iOS should exist by default.

Display them as draggable cards.

Each card contains:

* Drag handle
* Platform logo
* Platform name
* Active toggle
* Edit button

Example:

[drag]
Android
Download for Android
Active

[Edit]

---

# 14. ANDROID EDIT PANEL

When editing Android, show a modal or side panel.

Fields:

Platform Name:
Android

Platform Icon:
Android icon

Download Source:

Use segmented control:

* File
* Link

If File:

Show fake upload field:

Upload APK

Selected file example:

gosang-v2.1.0.apk
42.6 MB

This does not need real upload logic.

If Link:

Show input:

Download URL

Example:

https://play.google.com/store/apps/details?id=com.example.app

Button Label:

Download for Android

Subtitle:

Version 2.1.0

Toggle:

Active

Buttons:

Cancel
Save

---

# 15. IOS EDIT PANEL

Similar to Android.

Fields:

Platform Name:
iOS

Use Apple logo/icon.

Download URL

Button Label:

Download for iOS

Subtitle:

Available on App Store

Active toggle

---

# 16. ADD CUSTOM PLATFORM

Add prominent button:

* Add Download Button

Clicking it opens a modal.

Fields:

Platform Name

Example:
Windows

Platform Logo

Create an upload box for custom logo.

Download Type:

* File
* Link

Download URL or fake File Upload

Button Label

Example:
Download for Windows

Subtitle

Example:
Windows 10 or later

Active toggle

Buttons:
Cancel
Add Platform

After adding, append the platform card to the list using React local state.

---

# 17. DRAG AND DROP

If supported, allow user to reorder download buttons.

Example:

Android
iOS
Windows
macOS

Show a drag handle on every platform card.

If drag-and-drop implementation is too complex, still design the UI as draggable.

---

# 18. LIVE PREVIEW

On desktop Edit Project page, make the layout split into:

Left:
Settings form

Right:
Sticky Preview panel

The preview should look like a mobile phone or browser preview.

Title above:

Live Preview

The preview should update using React state when admin changes:

* Project name
* Company name
* Logo
* Background
* Colors
* Download buttons

On smaller screens, put Preview below the form.

This preview is important.

---

# 19. PUBLIC DOWNLOAD PAGE

Create page:

/download/gosang-mobile

This page should look significantly more polished than the Admin UI.

Primary purpose:

Let users quickly download the app.

Keep the design minimal.

Do not add:

* Navigation menu
* Large footer
* Long paragraphs
* Marketing sections
* Pricing
* Testimonials

Only focus on branding and downloading the app.

---

# 20. PUBLIC PAGE LAYOUT

Use full viewport:

min-height: 100vh

Background based on project settings.

Center the content horizontally and vertically.

Desktop content width:
around 420–480px.

Mobile:
width calc(100% - 32px)

---

# 21. DOWNLOAD CARD

Create a beautiful centered card.

Suggested style:

* Border radius 28px
* Generous padding
* Soft shadow
* Subtle border
* Backdrop blur if Glass style is selected

At the top display:

Company Logo

Company Name

Then:

Project/App Logo

Project Name

Small subtitle:

Download the app

or

Choose your platform to continue

Keep spacing clean and balanced.

---

# 22. PROJECT LOGO

Main app logo should be visually prominent.

Suggested size:

96px × 96px

Border radius:
22–26px

Use:

* slight shadow
* subtle border

---

# 23. DOWNLOAD BUTTON DESIGN

Create large premium download buttons.

Each button should contain:

Left:
Platform logo

Center:
Small text:
Download for

Large text:
Android

Optional right side:
Arrow icon

Example:

[ Android Logo ]

Download for
Android

→

Button size:

* Full width
* Height around 68–76px
* Rounded 16–18px

Buttons should feel easy to tap on mobile.

Use subtle hover:

* Slight translateY
* Slight shadow increase

Do not use excessive animations.

---

# 24. IOS BUTTON

Apple logo.

Text:

Download on the
App Store

or

Download for
iOS

Keep style consistent with Android.

---

# 25. CUSTOM PLATFORM BUTTONS

Custom platforms use uploaded logos.

Examples:

Windows

macOS

Huawei AppGallery

Enterprise APK

Each button uses the same layout and style.

---

# 26. MOBILE DESIGN

This page will mainly be used on mobile.

Optimize carefully for mobile.

Requirements:

* No horizontal scrolling
* Large touch targets
* Buttons at least 56px high
* Comfortable spacing
* Card not too wide
* Keep main buttons visible without unnecessary content
* Background image must cover entire viewport
* Text should remain readable over any background

---

# 27. SMART DEVICE UI

Simulate device detection.

If user is on Android:

Show Android button first.

Optionally add a small badge:

Recommended

If user is on iPhone:

Show iOS first.

Do not hide other platforms.

---

# 28. EXAMPLE PUBLIC PAGE

Use realistic mock content:

Company:
Gosang Corp

Project:
Gosang Mobile

Logo:
Use attractive placeholder app logo.

Platforms:

Android
Subtitle:
Version 2.1.0

iOS
Subtitle:
Available on App Store

Windows
Subtitle:
Windows 10 or later

---

# 29. VISUAL DIRECTION FOR PUBLIC PAGE

The public download page should look premium but very simple.

Think of modern app launch/download pages.

Use:

* subtle gradient background
* soft glow shapes in background
* modern typography
* high quality spacing
* rounded card
* clean platform buttons

Avoid:

* overly futuristic cyberpunk style
* excessive gradients
* excessive blur
* huge text
* complicated illustrations
* dashboard-like appearance

The main focus should always be:

Logo
Project Name
Download Buttons

---

# 30. INTERACTIONS

Implement frontend interactions with local state:

* Login button navigates to projects
* Create Project opens project editor
* Edit Project works
* Tabs work
* Toggle Active/Inactive
* Appearance options work
* Color settings update preview
* Background image preview
* Logo image preview
* Add custom download platform
* Edit platform
* Delete custom platform
* Enable/disable platform
* Reorder platform if possible
* Save button shows success toast
* Copy Public URL shows copied toast
* Preview button opens public page or preview modal
* Delete Project shows confirmation dialog

All data can be mock/local state.

No real API is required.

---

# 31. COMPONENT STRUCTURE

Create reusable React components such as:

AdminLayout

Sidebar

ProjectCard

ProjectForm

ImageUploader

AppearanceSettings

DownloadPlatformList

DownloadPlatformCard

PlatformEditorModal

PublicDownloadPage

DownloadButton

LivePreview

ConfirmDialog

Toast

ColorPicker

---

# 32. DESIGN QUALITY

Pay special attention to visual polish.

Admin UI:
simple, clean, productive.

Public UI:
premium, beautiful, mobile-first.

Use consistent:

* spacing
* typography
* border radius
* shadows
* icons

Make the generated frontend feel production-ready.

Do not create placeholder wireframes.

Generate actual polished UI components with realistic mock content.

---

# 33. IMPORTANT

This is FRONTEND ONLY.

Do not generate:

* Backend server
* REST API
* Database
* SQL schema
* Authentication server
* File storage server
* Docker
* Deployment configuration

Use only React UI and local mock data/state.

The most important screen is the Public Download Page.

Spend more visual design effort on the Public Download Page than the Admin Dashboard.

The public page must feel clean, elegant, premium, mobile-friendly, and simple enough that a user immediately understands where to click to download the app.
