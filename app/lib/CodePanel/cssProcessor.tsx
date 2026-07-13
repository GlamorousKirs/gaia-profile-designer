import postcss from 'postcss';

export const updateCssValue = (css: string, selector: string, property: string, value: string) => {
	const safeCss = css && css.trim().length > 0 ? css : '/* Initialized */';
	const root = postcss.parse(safeCss);
	let targetRule: any = null;

	root.walkRules(selector, (rule) => {
		targetRule = rule;
	});

	if (!targetRule) {
		targetRule = postcss.rule({ selector });
		root.append(targetRule);
	}

	if (property) {
		if (property === 'color' && value.includes('gradient')) {
			targetRule.nodes = targetRule.nodes.filter((n: any) => !['background', '-webkit-background-clip', '-webkit-text-fill-color', 'background-clip'].includes(n.prop));
			targetRule.append({ prop: 'background', value: value });
			targetRule.append({ prop: '-webkit-background-clip', value: 'text' });
			targetRule.append({ prop: '-webkit-text-fill-color', value: 'transparent' });
			targetRule.append({ prop: 'background-clip', value: 'text' });
		} 
		else {
			targetRule.nodes = targetRule.nodes.filter((n: any) => n.prop !== property);
			targetRule.append({ prop: property, value: value });
		}
	}

	return root.toString();
};

export const injectBlock = (css: string, selector: string, declarations: Record<string, string>) => {
	const safeCss = css && css.trim().length > 0 ? css : '/* Initialized */';
	const root = postcss.parse(safeCss);
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