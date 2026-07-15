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
				label: "Let me know",
				url: "https://www.gaiaonline.com/profiles/sunkirs/20150259/?mode=addcomment",
				prefix: "Have feedback? ",
			},
		],
		showClearStorage: true,
	},
];