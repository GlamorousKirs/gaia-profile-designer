(function () {
	const userStyles = document.getElementById('user-overrides');
	const identityStyles = document.getElementById('avatar-styles');

	let currentlyHovered = null;
	let activeSelector = "";

	let targetAvatar = "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3_flip.png";
	let targetUsername = "Sunkirs";

	document.addEventListener('click', (event) => {
		const link = event.target.closest('a');
		if (link) {
			event.preventDefault();
		}
	}, true);

	function getSemanticParentPath(element) {
		if (!element || element === document.body || element === document.documentElement) {
			return 'html, body';
		}

		const pathSegments = [];
		let current = element;

		while (current && current !== document.body && current !== document.documentElement) {
			if (!current.classList?.contains('iframe-selection-shield')) {
				if (current.id) {
					pathSegments.unshift(`#${current.id}`);
				} else if (current.className && typeof current.className === 'string') {
					const primaryClass = current.classList[0];
					if (primaryClass && !primaryClass.startsWith('highlight-')) {
						pathSegments.unshift(`.${primaryClass}`);
					} else if (current === element) {
						pathSegments.unshift(current.tagName.toLowerCase());
					}
				} else if (current === element) {
					pathSegments.unshift(current.tagName.toLowerCase());
				}
			}
			current = current.parentNode;
		}

		return pathSegments.length > 0 ? pathSegments.join(' ') : element.tagName.toLowerCase();
	}

	function applyIdentityOverrides() {
		const avatarSelectors = 'img.avatar, [data-avatar], .avatar img, [id*="avatar"] img, #id_details img';
		const avatarMedia = document.querySelectorAll(avatarSelectors);

		Array.from(avatarMedia).forEach(img => {
			if (targetAvatar && img.src !== targetAvatar) {
				img.src = targetAvatar;
				img.alt = `${targetUsername}'s avatar`;
				if (img.tagName === 'IMG') img.title = targetUsername;
			}
		});

		const usernameSelectors = '.profile-header-username, #profile-header .username, #profile-header .profile-title, #id_details h2';
		const profileHeaders = document.querySelectorAll(usernameSelectors);

		Array.from(profileHeaders).forEach(header => {
			if (targetUsername && header.textContent !== targetUsername) {
				header.textContent = targetUsername;
				header.setAttribute('title', targetUsername);
			}
		});

		const commentUsernames = document.querySelectorAll('.message p a');
		Array.from(commentUsernames).forEach(link => {
			if (targetUsername && link.textContent !== targetUsername && link.getAttribute('href')?.includes('/profiles/')) {
				link.textContent = targetUsername;
			}
		});
	}
	
	const structuralObserver = new MutationObserver(() => applyIdentityOverrides());
	structuralObserver.observe(document.documentElement, { childList: true, subtree: true });

	window.addEventListener('message', (event) => {
		const message = event.data;

		if (message.type === 'init-html' || message.type === 'update-html') {
			const coreScript = document.querySelector('script');
			document.body.innerHTML = message.html;
			if (coreScript) document.body.appendChild(coreScript);
			applyIdentityOverrides();
		}

		if (message.type === 'update-css' && userStyles) {
			userStyles.textContent = message.css;
		}

		if (message.type === 'update-identity') {
			targetAvatar = message.avatarUrl;
			targetUsername = message.username;
			applyIdentityOverrides();

			if (identityStyles && targetAvatar) {
				identityStyles.textContent =
					`:root { --user-avatar-url: url("${targetAvatar}"); } ` +
					`[data-avatar], [id*="avatar"], .avatar { content: var(--user-avatar-url) !important; }`;
			}
		}

		if (message.type === 'toggle-selection-mode') {
			window.isSelectionActive = message.active;
			if (!window.isSelectionActive && currentlyHovered) {
				currentlyHovered.classList.remove('highlight-hover');
				currentlyHovered = null;
			}
		}

		if (message.type === 'sync-selected-element') {
			activeSelector = message.selector || "";
			document.documentElement.classList.remove('highlight-selected');

			Array.from(document.querySelectorAll('.highlight-selected')).forEach(el => {
				el.classList.remove('highlight-selected');
			});

			if (message.selector) {
				try {
					if (message.selector === "html, body") {
						document.documentElement.classList.add('highlight-selected');
					} else {
						Array.from(document.querySelectorAll(message.selector)).forEach(el => {
							el.classList.add('highlight-selected');
						});
					}
				} catch (e) { }
			}
		}
	});

	document.addEventListener('mouseover', (event) => {
		if (!window.isSelectionActive) return;
		if (currentlyHovered && currentlyHovered !== event.target) {
			currentlyHovered.classList.remove('highlight-hover');
		}
		currentlyHovered = event.target;
		if (currentlyHovered) currentlyHovered.classList.add('highlight-hover');
	});

	document.addEventListener('mouseout', (event) => {
		if (!window.isSelectionActive) return;
		if (currentlyHovered === event.target) {
			if (currentlyHovered) currentlyHovered.classList.remove('highlight-hover');
			currentlyHovered = null;
		}
	});

	document.addEventListener('click', (event) => {
		if (!window.isSelectionActive) return;

		let target = event.target;
		if (target.classList.contains('iframe-selection-shield')) {
			const iframe = target.parentElement.querySelector('iframe');
			if (iframe) target = iframe;
		}

		event.preventDefault();
		event.stopPropagation();

		const semanticSelection = getSemanticParentPath(target);
		const includeDescendants = event.shiftKey;
		const isAdditiveSelection = event.ctrlKey || event.metaKey;

		let processingSelector = semanticSelection;
		if (includeDescendants && target !== document.body && target !== document.documentElement) {
			processingSelector = `${semanticSelection}, ${semanticSelection} *`;
			window.getSelection()?.removeAllRanges();
		}

		let finalSelection = processingSelector;

		if (isAdditiveSelection) {
			if (activeSelector) {
				const currentTokens = activeSelector.split(',').map(s => s.trim());
				const newTokens = processingSelector.split(',').map(s => s.trim());
				const uniqueTokens = newTokens.filter(s => !currentTokens.includes(s));

				finalSelection = uniqueTokens.length > 0
					? `${activeSelector}, ${uniqueTokens.join(", ")}`
					: activeSelector;
			}
		} else if (activeSelector === finalSelection) {
			finalSelection = "";
		}

		window.parent.postMessage({ type: 'element-selected', selector: finalSelection }, '*');
	}, true);
})();