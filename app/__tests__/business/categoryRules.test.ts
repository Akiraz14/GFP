import {
  CATEGORY_NAME_MAX_LENGTH,
  categoryNameKey,
  normalizeCategoryName,
  toValidCategoryInput,
  validateCategoryInput,
} from '../../src/business/categories/categoryRules';

const VALID = { name: 'Mascotas', type: 'expense', icon: 'pet' };

describe('category name normalization (E06-D9)', () => {
  test('trims and collapses inner whitespace, including line breaks', () => {
    expect(normalizeCategoryName('  Comida   para\n\tperros  ')).toBe(
      'Comida para perros',
    );
  });

  test('uses NFC so composed and decomposed accents are the same name', () => {
    expect(normalizeCategoryName('Educación')).toBe('Educación');
    expect(categoryNameKey('Educación')).toBe(categoryNameKey('Educación'));
  });

  test('HU8-CA04: the key ignores upper and lower case', () => {
    expect(categoryNameKey('ALIMENTACIÓN')).toBe('alimentación');
    expect(categoryNameKey(' mAsCoTaS ')).toBe('mascotas');
  });

  test('the key keeps accents: «Alimentacion» differs from «Alimentación»', () => {
    expect(categoryNameKey('Alimentacion')).not.toBe(
      categoryNameKey('Alimentación'),
    );
  });
});

describe('category input validation (HU8-CA03)', () => {
  test('accepts a name, a type and an icon from the catalog', () => {
    expect(validateCategoryInput(VALID)).toEqual({});
    expect(toValidCategoryInput({ ...VALID, name: ' Mascotas ' })).toEqual({
      name: 'Mascotas',
      nameNormalized: 'mascotas',
      type: 'expense',
      icon: 'pet',
    });
  });

  test('requires every field', () => {
    expect(validateCategoryInput({ name: '   ', type: '', icon: '' })).toEqual({
      name: 'required',
      type: 'required',
      icon: 'required',
    });
    expect(toValidCategoryInput({ name: '', type: '', icon: '' })).toBeNull();
  });

  test(`limits the name to ${CATEGORY_NAME_MAX_LENGTH} characters after trimming`, () => {
    const longest = 'a'.repeat(CATEGORY_NAME_MAX_LENGTH);
    expect(validateCategoryInput({ ...VALID, name: `  ${longest}  ` })).toEqual(
      {},
    );
    expect(validateCategoryInput({ ...VALID, name: `${longest}b` })).toEqual({
      name: 'too_long',
    });
  });

  test('only accepts «income» or «expense» as type', () => {
    expect(validateCategoryInput({ ...VALID, type: 'income' })).toEqual({});
    expect(validateCategoryInput({ ...VALID, type: 'saving' })).toEqual({
      type: 'invalid',
    });
  });

  test('only accepts the 12 icons of the selector (E06-D5)', () => {
    expect(validateCategoryInput({ ...VALID, icon: 'more' })).toEqual({});
    for (const icon of ['wallet', 'gamepad', 'shopping-bag', 'rocket']) {
      expect(validateCategoryInput({ ...VALID, icon })).toEqual({
        icon: 'invalid',
      });
    }
  });

  test('counts the 40-character limit in code points (E06-D9b, E03-D5)', () => {
    expect(validateCategoryInput({ ...VALID, name: '😀'.repeat(40) })).toEqual(
      {},
    );
    expect(validateCategoryInput({ ...VALID, name: '😀'.repeat(41) })).toEqual({
      name: 'too_long',
    });
  });
});
