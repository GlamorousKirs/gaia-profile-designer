import postcss from 'postcss';

export const updateCssValue = (css: string, selector: string, property: string, value: string) => {
	let root;
	try {
		root = postcss.parse(css || '');
	} catch (e) {
		root = postcss.root();
	}
	let targetRule: any = null;

	root.walkRules(selector, (rule) => {
		targetRule = rule;
	});

	if (!targetRule) {
		targetRule = postcss.rule({ selector });
		root.append(targetRule);
	}

	if (property) {
		const gradientProps = ['background'];

		if (value.includes('gradient')) {
			targetRule.nodes = targetRule.nodes.filter((n: any) => !gradientProps.includes(n.prop) && n.prop !== 'background-color');
			targetRule.append({ prop: 'background', value: value });
		} 
		else {
			targetRule.nodes = targetRule.nodes.filter((n: any) => n.prop !== property && !gradientProps.includes(n.prop));
			targetRule.append({ prop: property, value: value });
		}
	}

	return root.toString();
};

export const injectBlock = (css: string, selector: string, declarations: Record<string, string>) => {
	let root;
	try {
		root = postcss.parse(css || '');
	} catch (e) {
		root = postcss.root();
	}
	let targetRule: any = null;

	root.walkRules(selector, (rule) => { targetRule = rule; });
	if (!targetRule) {
		targetRule = postcss.rule({ selector });
		root.append(targetRule);
	}

	Object.entries(declarations).forEach(([prop, val]) => {
		targetRule.nodes = targetRule.nodes.filter((n: any) => n.prop !== prop);
		targetRule.append({ prop, value: val });
	});

	return root.toString();
};