export interface AnnouncementItem {
	date: string;
	timestamp: string;
	message: string;
	warning?: string;
	links?: {
		label: string;
		url: string;
		prefix: string;
	}[];
	showClearStorage?: boolean;
}

export const ANNOUNCEMENTS: AnnouncementItem[] = [
	{
		date: "Update #5",
		timestamp: "2026-07-16",
		message: `An update for panels: Right-clicking on Panels in the left sidebar will show a context menu that lets you instantly add their selectors, along with useful pseudo-elements (::before, ::after) and pseudo-classes (:hover, :focus, :active), directly to your code editor. This also works on Selectors in the Selectors tab.`,
	},
	{
		date: "Update #4",
		timestamp: "2026-07-15",
		message: `- Added Media Panel creation. #id_about is now editable. Right click on them to edit. \n\nI'm taking a break soon. Expect less frequent updates. I hope you're enjoying the project though! Let me know when you find a bug. I'll try to fix it when I have time.\n\nTip: Selecting the Gaia logo on the canvas will display the logo menu in the right sidebar.\n\nSometimes I update the proj without announcing it.`,
		links: [
			{
				label: "commits here",
				url: "https://github.com/GlamorousKirs/gaia-profile-designer/commits/master/",
				prefix: "You can see the ",
			},
		],
	},
	{
		date: "Update #3",
		timestamp: "2026-07-15",
		message: `- Added "Centered Columns" snippet.\n- Added BBCode image support for custom panels. You can now also highlight text to wrap it with tags when using the BBcode toolbar.\n- Fixed custom panels. CSS styling not applying correctly when targeting custom panels because their IDs were being generated with a double prefix (e.q., #id_#id_custom_...)`,
	},
	{
		date: "Update #2",
		timestamp: "2026-07-15",
		message: "Exporting and importing data has been fixed; you can now use them.",
		links: [
			{
				label: "Settings",
				url: "https://glamorouskirs.github.io/gaia-profile-designer/settings",
				prefix: "Go to ",
			},
		],
	},
	{
		date: "Update #1",
		timestamp: "2026-07-14",
		message: "There have been some changes made, so most features that use storage will work properly. If you cannot save anything, please clear your browser storage.",
		warning: "(Clicking the Clear Storage will immediately clear it) Sorry for the inconvenience!",
		links: [
			{
				label: "Add a comment",
				url: "https://www.gaiaonline.com/profiles/sunkirs/20150259/?mode=addcomment",
				prefix: "Have feedback? ",
			},
		],
		showClearStorage: true,
	},
];