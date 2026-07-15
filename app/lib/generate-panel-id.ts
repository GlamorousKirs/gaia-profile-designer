export const generateNumericId = (): string => {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);

	const min = 1;
	const max = 999;

	return (array[0] % (max - min + 1) + min).toString();
};