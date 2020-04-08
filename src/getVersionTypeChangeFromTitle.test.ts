import { getVersionTypeChangeFromTitle } from './getVersionTypeChangeFromTitle';

describe(getVersionTypeChangeFromTitle.name, () => {
    it('should parse title correctly for minor version', () => {
        const title = 'Bump jest from 25.2.7 to 25.3.0';

        const result = getVersionTypeChangeFromTitle(title);

        expect(result).toBe('MINOR');
    })
})