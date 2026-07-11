(function () {
	if (document.getElementById("avatar_menu") && document.getElementById("avatar_menu").dataset.customMenu === "true") {
		console.log("Custom permanent avatar menu detected. Disabling hover javascript engine.");
		return;
	}

	let menu = document.getElementById("avatar_menu");
	let hideTimer = null;

	if (!menu) {
		menu = document.createElement("ul");
		menu.id = "avatar_menu";
		document.body.appendChild(menu);
	}

	const populate = (o) => {
		menu.innerHTML = `
			<li id="viewposts"><a href="/gsearch/posthistory/${o.id}">View Posts</a></li>
			<li><a href="/collections/show/${o.id}">Favorites</a></li>
			<li><a href="/achievements/public/${o.id}">Achievements</a></li>
			<li><a href="/profiles/${encodeURIComponent(o.username)}/${o.id}/">Profile</a></li>
			<li id="jointhem"><a href="/get/location?userid=${o.id}">Join Them</a></li>
			<li id="journalentry"><a href="/journal/?mode=view&u=${o.id}">Journal</a></li>
			<li id="addfriend"><a href="/friends/add/${o.id}">Add as Friend</a></li>
			<li class="menu_seperator">&nbsp;</li>
			<li id="sendpm"><a href="/profile/privmsg.php?mode=post&u=${o.id}">Send PM</a></li>
			<li id="viewstore"><a href="/marketplace/userstore/${o.id}">View Store</a></li>
			<li id="sendim"><a href="javascript:void(0);">Send IM</a></li>
			<li class="menu_seperator">&nbsp;</li>
			<li id="trade"><a href="/gaia/bank.php?mode=trade&uid=${o.id}">Trade</a></li>
			<li><a href="javascript:void(0);">View Equipped List</a></li>
			<li id="website"><a href="${o.website}">My website</a></li>
			<li class="menu_seperator" id="ignoreline">&nbsp;</li>
			<li id="ignore"><a href="/friends/?hook=${o.id}">Ignore</a></li>
		`;
	};

	document.addEventListener("mouseover", (e) => {
		const pushbox = e.target.closest(".pushBox");
		if (pushbox) {
			clearTimeout(hideTimer);
			const container = pushbox.parentNode.parentNode;
			const rect = container.getBoundingClientRect();

			populate({
				id: pushbox.dataset.uid,
				username: pushbox.dataset.username,
				website: pushbox.dataset.website
			});

			menu.style.width = "120px";
			menu.style.top = (window.scrollY + rect.bottom - 1) + "px";
			menu.style.left = (window.scrollX + rect.left) + "px";
			menu.style.display = "block";
		}
	});

	document.addEventListener("mouseout", (e) => {
		const pushbox = e.target.closest(".pushBox");
		const isMenu = e.target.closest("#avatar_menu");

		if (pushbox || isMenu) {
			hideTimer = setTimeout(() => {
				menu.style.display = "none";
			}, 300);
		}
	});

	menu.addEventListener("mouseover", () => {
		clearTimeout(hideTimer);
	});

document.addEventListener("click", (e) => {
		const isSpoilerControl = e.target.closest("button.spoiler-control") || e.target.closest(".spoiler-control");
		const isAvatarMenu = e.target.closest("#avatar_menu");
		const targetLink = e.target.closest("a");

		if (isSpoilerControl) {
			const wrapper = isSpoilerControl.closest(".spoiler-wrapper") || isSpoilerControl.parentElement;
			if (wrapper) {
				const isHidden = wrapper.classList.contains("spoiler-hidden") || wrapper.style.display === "none";
				
				if (isHidden) {
					wrapper.classList.remove("spoiler-hidden");
					wrapper.classList.add("spoiler-revealed");
					wrapper.style.display = "block";
				} else {
					wrapper.classList.add("spoiler-hidden");
					wrapper.classList.remove("spoiler-revealed");
					wrapper.style.display = "none";
				}
				e.preventDefault();
			}
			return;
		}

		if (isAvatarMenu) {
			return;
		}

		if (targetLink && window.isSelectionModeActive) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	}, true);
})();