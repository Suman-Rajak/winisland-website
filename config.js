/*
  WinIsland website settings. Edit these, push, and the site updates itself.

  While downloadUrl and storeUrl are both empty the site is in "coming soon" mode: the
  download and Store buttons say "Soon" and point people to the waitlist. Fill in either
  one at launch and the buttons go live everywhere on the page.
*/
window.WINISLAND = {
  // Direct installer, e.g. a GitHub release asset: https://github.com/<you>/<repo>/releases/latest/download/WinIsland.msix
  downloadUrl: '',

  // Your Microsoft Store listing: https://apps.microsoft.com/detail/<Store ID>
  storeUrl: '',

  // Shown under the download button at launch, e.g. '1.0.0' and '24 MB'.
  version: '',
  size: '',

  // The Google Apps Script web app that saves waitlist emails to your Google Sheet
  // (see apps-script/README.md). It ends in /exec. Empty: emails aren't sent anywhere.
  waitlistUrl: 'https://script.google.com/macros/s/AKfycbyMwc_2HmANndP8kuBXSW6OuG0EB1rP_zpeNDFC4zWktIMr9Fs4Ao-jfbLT9slhBE7a/exec',
};
