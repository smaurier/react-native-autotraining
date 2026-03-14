// =============================================================================
// Lab 11 — Formulaires et validation (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-11-formulaires-validation/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 11 — Formulaires et validation (Solution)');

// =============================================================================
// Types
// =============================================================================

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

interface FieldValidationResult {
  valid: boolean;
  errors: string[];
}

type ValidatorFn = (value: unknown) => string | null;

interface FieldSchema {
  type: 'string' | 'number' | 'email' | 'boolean';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: ValidatorFn;
}

interface FormSchema {
  [field: string]: FieldSchema;
}

interface FormValidator {
  validate: (data: Record<string, unknown>) => ValidationResult;
  validateField: (field: string, value: unknown) => FieldValidationResult;
}

interface StepConfig {
  fields: string[];
  schema: FormSchema;
}

interface MultiStepForm {
  getCurrentStep: () => number;
  getTotalSteps: () => number;
  next: (data: Record<string, unknown>) => boolean;
  prev: () => boolean;
  canProceed: (data: Record<string, unknown>) => boolean;
  getCurrentErrors: (data: Record<string, unknown>) => Record<string, string[]>;
  isComplete: () => boolean;
  reset: () => void;
}

type InputType = 'text' | 'email' | 'html' | 'numeric';

interface FieldMask {
  apply: (input: string) => string;
  unmask: (input: string) => string;
  isComplete: (input: string) => boolean;
}

interface FormState {
  values: Record<string, string>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

type FormAction =
  | { type: 'SET_VALUE'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; errors: string[] }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_TOUCHED'; field: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET'; initialValues: Record<string, string> }
  | { type: 'VALIDATE_ALL'; errors: Record<string, string[]> };

// =============================================================================
// Exercice 1 : createFormValidator
// =============================================================================

function createFormValidator(schema: FormSchema): FormValidator {
  function validateSingleField(fieldSchema: FieldSchema, value: unknown): string[] {
    const errors: string[] = [];

    // Required check
    if (fieldSchema.required) {
      if (value === null || value === undefined || value === '') {
        errors.push('Ce champ est requis');
        return errors; // pas la peine de continuer
      }
    } else if (value === null || value === undefined || value === '') {
      return errors; // champ optionnel vide, pas d'erreur
    }

    const strValue = String(value);

    // Type check
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('Ce champ doit etre une chaine de caracteres');
        }
        break;
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) {
          errors.push('Ce champ doit etre un nombre');
        } else {
          if (fieldSchema.min !== undefined && num < fieldSchema.min) {
            errors.push(`La valeur minimale est ${fieldSchema.min}`);
          }
          if (fieldSchema.max !== undefined && num > fieldSchema.max) {
            errors.push(`La valeur maximale est ${fieldSchema.max}`);
          }
        }
        break;
      }
      case 'email':
        if (!strValue.includes('@') || !strValue.includes('.')) {
          errors.push('Format email invalide');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push('Ce champ doit etre un booleen');
        }
        break;
    }

    // MinLength / MaxLength
    if (fieldSchema.minLength !== undefined && strValue.length < fieldSchema.minLength) {
      errors.push(`Minimum ${fieldSchema.minLength} caracteres`);
    }
    if (fieldSchema.maxLength !== undefined && strValue.length > fieldSchema.maxLength) {
      errors.push(`Maximum ${fieldSchema.maxLength} caracteres`);
    }

    // Pattern
    if (fieldSchema.pattern && !fieldSchema.pattern.test(strValue)) {
      errors.push(fieldSchema.patternMessage ?? 'Format invalide');
    }

    // Custom
    if (fieldSchema.custom) {
      const customError = fieldSchema.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors;
  }

  return {
    validate(data) {
      const allErrors: Record<string, string[]> = {};
      let valid = true;

      for (const [field, fieldSchema] of Object.entries(schema)) {
        const fieldErrors = validateSingleField(fieldSchema, data[field]);
        if (fieldErrors.length > 0) {
          allErrors[field] = fieldErrors;
          valid = false;
        }
      }

      return { valid, errors: allErrors };
    },

    validateField(field, value) {
      const fieldSchema = schema[field];
      if (!fieldSchema) {
        return { valid: true, errors: [] };
      }
      const errors = validateSingleField(fieldSchema, value);
      return { valid: errors.length === 0, errors };
    },
  };
}

// =============================================================================
// Exercice 2 : createMultiStepForm
// =============================================================================

function createMultiStepForm(steps: StepConfig[]): MultiStepForm {
  let currentStep = 0;
  let completed = false;

  function validateStep(stepIndex: number, data: Record<string, unknown>): ValidationResult {
    const step = steps[stepIndex];
    const validator = createFormValidator(step.schema);
    // Ne valider que les champs de cette etape
    const stepData: Record<string, unknown> = {};
    for (const field of step.fields) {
      stepData[field] = data[field];
    }
    return validator.validate(stepData);
  }

  return {
    getCurrentStep: () => currentStep,
    getTotalSteps: () => steps.length,

    next(data) {
      if (completed || currentStep >= steps.length) return false;
      const result = validateStep(currentStep, data);
      if (result.valid) {
        currentStep++;
        if (currentStep >= steps.length) {
          completed = true;
        }
        return true;
      }
      return false;
    },

    prev() {
      if (currentStep <= 0) return false;
      currentStep--;
      completed = false;
      return true;
    },

    canProceed(data) {
      if (currentStep >= steps.length) return false;
      const result = validateStep(currentStep, data);
      return result.valid;
    },

    getCurrentErrors(data) {
      if (currentStep >= steps.length) return {};
      const result = validateStep(currentStep, data);
      return result.errors;
    },

    isComplete: () => completed,

    reset() {
      currentStep = 0;
      completed = false;
    },
  };
}

// =============================================================================
// Exercice 3 : sanitizeInput
// =============================================================================

function sanitizeInput(value: string, type: InputType): string {
  switch (type) {
    case 'text':
      return value.trim().replace(/\s+/g, ' ');
    case 'email':
      return value.trim().toLowerCase().replace(/\s/g, '');
    case 'html':
      // D'abord supprimer les balises script/style avec leur contenu
      return value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, '');
    case 'numeric': {
      // Garde chiffres, points, et tiret en debut
      const cleaned = value.replace(/[^0-9.\-]/g, '');
      // Ne garder le tiret qu'au debut
      if (cleaned.startsWith('-')) {
        return '-' + cleaned.slice(1).replace(/-/g, '');
      }
      return cleaned.replace(/-/g, '');
    }
  }
}

// =============================================================================
// Exercice 4 : createFieldMask
// =============================================================================

function createFieldMask(pattern: string): FieldMask {
  // Compter le nombre de slots (# ou A) dans le pattern
  const slotCount = pattern.split('').filter((c) => c === '#' || c === 'A').length;

  function extractRawChars(input: string): string {
    // Determiner quels caracteres du pattern sont des separateurs
    const separators = new Set<string>();
    for (const c of pattern) {
      if (c !== '#' && c !== 'A') {
        separators.add(c);
      }
    }
    // Retirer les separateurs de l'input
    return input.split('').filter((c) => !separators.has(c)).join('');
  }

  return {
    apply(input: string) {
      const raw = extractRawChars(input);
      let result = '';
      let rawIndex = 0;

      for (let i = 0; i < pattern.length && rawIndex < raw.length; i++) {
        const maskChar = pattern[i];
        if (maskChar === '#') {
          if (/\d/.test(raw[rawIndex])) {
            result += raw[rawIndex];
            rawIndex++;
          } else {
            break;
          }
        } else if (maskChar === 'A') {
          if (/[a-zA-Z]/.test(raw[rawIndex])) {
            result += raw[rawIndex];
            rawIndex++;
          } else {
            break;
          }
        } else {
          // Separateur : l'ajouter au resultat
          result += maskChar;
        }
      }

      return result;
    },

    unmask(input: string) {
      return extractRawChars(input);
    },

    isComplete(input: string) {
      const raw = extractRawChars(input);
      return raw.length >= slotCount;
    },
  };
}

// =============================================================================
// Exercice 5 : formStateReducer
// =============================================================================

function formStateReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };

    case 'SET_ERROR': {
      const newErrors = { ...state.errors, [action.field]: action.errors };
      const hasErrors = Object.values(newErrors).some((e) => e && e.length > 0);
      return {
        ...state,
        errors: newErrors,
        isValid: !hasErrors,
      };
    }

    case 'CLEAR_ERROR': {
      const { [action.field]: _, ...remainingErrors } = state.errors;
      const hasErrors = Object.values(remainingErrors).some((e) => e && e.length > 0);
      return {
        ...state,
        errors: remainingErrors,
        isValid: !hasErrors,
      };
    }

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case 'RESET':
      return {
        values: { ...action.initialValues },
        errors: {},
        touched: {},
        isSubmitting: false,
        isValid: true,
      };

    case 'VALIDATE_ALL': {
      const hasErrors = Object.values(action.errors).some((e) => e && e.length > 0);
      return {
        ...state,
        errors: { ...action.errors },
        isValid: !hasErrors,
      };
    }
  }
}

// =============================================================================
// Tests
// =============================================================================

// --- createFormValidator ---

test('createFormValidator - valide un formulaire correct', () => {
  const validator = createFormValidator({
    name: { type: 'string', required: true, minLength: 2 },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 18, max: 120 },
  });

  const result = validator.validate({ name: 'Alice', email: 'alice@test.com', age: 25 });
  assertTrue(result.valid);
  assertEqual(Object.keys(result.errors).length, 0);
});

test('createFormValidator - detecte les erreurs', () => {
  const validator = createFormValidator({
    name: { type: 'string', required: true, minLength: 2 },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 18 },
  });

  const result = validator.validate({ name: '', email: 'invalid', age: 15 });
  assertFalse(result.valid);
  assertTrue(result.errors['name'].length > 0);
  assertTrue(result.errors['email'].length > 0);
  assertTrue(result.errors['age'].length > 0);
});

test('createFormValidator - validateField sur un seul champ', () => {
  const validator = createFormValidator({
    email: { type: 'email', required: true },
  });

  const valid = validator.validateField('email', 'ok@test.com');
  assertTrue(valid.valid);

  const invalid = validator.validateField('email', 'not-email');
  assertFalse(invalid.valid);
  assertTrue(invalid.errors.length > 0);
});

test('createFormValidator - pattern avec message personnalise', () => {
  const validator = createFormValidator({
    phone: {
      type: 'string',
      required: true,
      pattern: /^\+?[0-9]{10,15}$/,
      patternMessage: 'Numero de telephone invalide',
    },
  });

  const result = validator.validateField('phone', 'abc');
  assertFalse(result.valid);
  assertTrue(result.errors.includes('Numero de telephone invalide'));
});

test('createFormValidator - custom validator', () => {
  const validator = createFormValidator({
    password: {
      type: 'string',
      required: true,
      minLength: 8,
      custom: (value) => {
        const str = String(value);
        if (!/[A-Z]/.test(str)) return 'Au moins une majuscule';
        if (!/[0-9]/.test(str)) return 'Au moins un chiffre';
        return null;
      },
    },
  });

  const weak = validator.validateField('password', 'password');
  assertFalse(weak.valid);

  const strong = validator.validateField('password', 'Password1');
  assertTrue(strong.valid);
});

// --- createMultiStepForm ---

test('createMultiStepForm - navigation entre etapes', () => {
  const form = createMultiStepForm([
    { fields: ['name', 'email'], schema: { name: { type: 'string', required: true }, email: { type: 'email', required: true } } },
    { fields: ['street', 'city'], schema: { street: { type: 'string', required: true }, city: { type: 'string', required: true } } },
    { fields: ['card'], schema: { card: { type: 'string', required: true, minLength: 16 } } },
  ]);

  assertEqual(form.getCurrentStep(), 0);
  assertEqual(form.getTotalSteps(), 3);
  assertFalse(form.isComplete());

  assertTrue(form.next({ name: 'Alice', email: 'alice@test.com' }));
  assertEqual(form.getCurrentStep(), 1);

  assertTrue(form.prev());
  assertEqual(form.getCurrentStep(), 0);

  assertFalse(form.prev());
});

test('createMultiStepForm - bloque si donnees invalides', () => {
  const form = createMultiStepForm([
    { fields: ['name'], schema: { name: { type: 'string', required: true, minLength: 2 } } },
    { fields: ['age'], schema: { age: { type: 'number', min: 18 } } },
  ]);

  assertFalse(form.next({ name: '' }));
  assertEqual(form.getCurrentStep(), 0);

  assertFalse(form.canProceed({ name: 'A' }));
  assertTrue(form.canProceed({ name: 'Alice' }));
});

test('createMultiStepForm - getCurrentErrors et isComplete', () => {
  const form = createMultiStepForm([
    { fields: ['name'], schema: { name: { type: 'string', required: true } } },
    { fields: ['email'], schema: { email: { type: 'email', required: true } } },
  ]);

  const errors = form.getCurrentErrors({ name: '' });
  assertTrue(errors['name'].length > 0);

  form.next({ name: 'Alice' });
  form.next({ email: 'alice@test.com' });
  assertTrue(form.isComplete());

  form.reset();
  assertEqual(form.getCurrentStep(), 0);
  assertFalse(form.isComplete());
});

// --- sanitizeInput ---

test('sanitizeInput - type text', () => {
  assertEqual(sanitizeInput('  Hello   World  ', 'text'), 'Hello World');
});

test('sanitizeInput - type email', () => {
  assertEqual(sanitizeInput('  Alice@EXAMPLE.com  ', 'email'), 'alice@example.com');
});

test('sanitizeInput - type html', () => {
  assertEqual(sanitizeInput('<b>Hello</b> <script>alert("xss")</script>World', 'html'), 'Hello World');
});

test('sanitizeInput - type numeric', () => {
  assertEqual(sanitizeInput('-123.45abc', 'numeric'), '-123.45');
  assertEqual(sanitizeInput('abc', 'numeric'), '');
});

// --- createFieldMask ---

test('createFieldMask - masque de date', () => {
  const mask = createFieldMask('##/##/####');

  assertEqual(mask.apply('25122025'), '25/12/2025');
  assertEqual(mask.apply('251'), '25/1');
  assertEqual(mask.unmask('25/12/2025'), '25122025');
  assertTrue(mask.isComplete('25/12/2025'));
  assertFalse(mask.isComplete('25/1'));
});

test('createFieldMask - masque de carte bancaire', () => {
  const mask = createFieldMask('#### #### #### ####');

  assertEqual(mask.apply('4242424242424242'), '4242 4242 4242 4242');
  assertEqual(mask.apply('4242'), '4242');
  assertEqual(mask.unmask('4242 4242 4242 4242'), '4242424242424242');
  assertTrue(mask.isComplete('4242 4242 4242 4242'));
  assertFalse(mask.isComplete('4242 4242'));
});

test('createFieldMask - masque avec lettres', () => {
  const mask = createFieldMask('AA-###');

  assertEqual(mask.apply('AB123'), 'AB-123');
  assertEqual(mask.unmask('AB-123'), 'AB123');
  assertTrue(mask.isComplete('AB-123'));
});

// --- formStateReducer ---

test('formStateReducer - SET_VALUE et SET_TOUCHED', () => {
  const initial: FormState = {
    values: { name: '', email: '' },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  };

  let state = formStateReducer(initial, { type: 'SET_VALUE', field: 'name', value: 'Alice' });
  assertEqual(state.values['name'], 'Alice');
  assertEqual(state.values['email'], '');

  state = formStateReducer(state, { type: 'SET_TOUCHED', field: 'name' });
  assertTrue(state.touched['name']);
  assertFalse(state.touched['email'] ?? false);
});

test('formStateReducer - SET_ERROR et CLEAR_ERROR', () => {
  const initial: FormState = {
    values: { name: '' },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  };

  let state = formStateReducer(initial, {
    type: 'SET_ERROR',
    field: 'name',
    errors: ['Champ requis'],
  });
  assertDeepEqual(state.errors['name'], ['Champ requis']);
  assertFalse(state.isValid);

  state = formStateReducer(state, { type: 'CLEAR_ERROR', field: 'name' });
  assertEqual(state.errors['name'], undefined);
  assertTrue(state.isValid);
});

test('formStateReducer - RESET et VALIDATE_ALL', () => {
  const state: FormState = {
    values: { name: 'Alice' },
    errors: { name: ['erreur'] },
    touched: { name: true },
    isSubmitting: true,
    isValid: false,
  };

  const reset = formStateReducer(state, {
    type: 'RESET',
    initialValues: { name: '', email: '' },
  });
  assertEqual(reset.values['name'], '');
  assertEqual(reset.values['email'], '');
  assertDeepEqual(reset.errors, {});
  assertDeepEqual(reset.touched, {});
  assertFalse(reset.isSubmitting);
  assertTrue(reset.isValid);

  const validated = formStateReducer(reset, {
    type: 'VALIDATE_ALL',
    errors: { name: ['Requis'], email: ['Invalide'] },
  });
  assertDeepEqual(validated.errors['name'], ['Requis']);
  assertDeepEqual(validated.errors['email'], ['Invalide']);
  assertFalse(validated.isValid);
});

// =============================================================================
run();
