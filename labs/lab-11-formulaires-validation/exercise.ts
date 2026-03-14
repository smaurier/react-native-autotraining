// =============================================================================
// Lab 11 — Formulaires et validation (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-11-formulaires-validation/exercise.ts
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

const { test, run } = createTestRunner('Lab 11 — Formulaires et validation');

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
// Cree un validateur de formulaire a partir d'un schema.
//
// createFormValidator(schema) -> FormValidator
//
// Le schema definit les regles par champ :
// - type 'string' : verifie que la valeur est une string
// - type 'number' : verifie que la valeur est un nombre (ou string convertible)
// - type 'email' : verifie le format email basique (contient @ et .)
// - type 'boolean' : verifie que la valeur est un boolean
// - required : la valeur ne doit pas etre vide/null/undefined
// - minLength/maxLength : longueur de la string
// - min/max : valeur numerique
// - pattern : regex avec message d'erreur personnalise
// - custom : fonction validateur personnalise
//
// validate(data) retourne { valid, errors } avec errors = { field: [messages] }
// validateField(field, value) retourne { valid, errors: [messages] }
// =============================================================================

// TODO: Implementez createFormValidator

// =============================================================================
// Exercice 2 : createMultiStepForm
// Cree un formulaire multi-etapes avec validation par etape.
//
// createMultiStepForm(steps) -> MultiStepForm
//
// - getCurrentStep() retourne l'index de l'etape courante (0-based)
// - getTotalSteps() retourne le nombre total d'etapes
// - next(data) valide l'etape courante et avance si valide, retourne true/false
// - prev() recule d'une etape, retourne false si deja a l'etape 0
// - canProceed(data) verifie si l'etape courante est valide sans avancer
// - getCurrentErrors(data) retourne les erreurs de l'etape courante
// - isComplete() retourne true si on est passe au-dela de la derniere etape
// - reset() remet a l'etape 0
// =============================================================================

// TODO: Implementez createMultiStepForm

// =============================================================================
// Exercice 3 : sanitizeInput
// Nettoie une valeur saisie selon son type.
//
// sanitizeInput(value, type) -> string
//
// - 'text' : trim, collapse whitespace multiple en un seul espace
// - 'email' : trim, lowercase, supprime les espaces
// - 'html' : supprime toutes les balises HTML (<...>)
// - 'numeric' : ne garde que les chiffres, points et tirets en debut
// =============================================================================

// TODO: Implementez sanitizeInput

// =============================================================================
// Exercice 4 : createFieldMask
// Cree un masque de saisie pour formater les valeurs au fur et a mesure.
//
// createFieldMask(pattern) -> FieldMask
//
// Le pattern utilise :
// - '#' pour un chiffre
// - 'A' pour une lettre
// - Tout autre caractere est un separateur litteral
//
// apply(input) : applique le masque sur les caracteres bruts
// unmask(input) : retourne uniquement les caracteres bruts (sans separateurs)
// isComplete(input) : true si tous les slots du masque sont remplis
//
// Exemples :
// pattern '##/##/####' (date)
//   apply('25122025') -> '25/12/2025'
//   apply('251')      -> '25/1'
//   unmask('25/12/2025') -> '25122025'
//   isComplete('25/12/2025') -> true
//   isComplete('25/1')       -> false
//
// pattern '#### #### #### ####' (carte bancaire)
//   apply('4242424242424242') -> '4242 4242 4242 4242'
// =============================================================================

// TODO: Implementez createFieldMask

// =============================================================================
// Exercice 5 : formStateReducer
// Reducer pour gerer l'etat d'un formulaire (pattern useReducer).
//
// formStateReducer(state, action) -> FormState
//
// Actions :
// - SET_VALUE : met a jour la valeur d'un champ
// - SET_ERROR : definit les erreurs d'un champ
// - CLEAR_ERROR : supprime les erreurs d'un champ
// - SET_TOUCHED : marque un champ comme touche
// - SET_SUBMITTING : active/desactive le flag de soumission
// - RESET : reinitialise tout avec les valeurs initiales
// - VALIDATE_ALL : remplace toutes les erreurs et recalcule isValid
// =============================================================================

// TODO: Implementez formStateReducer

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

  // Avancer avec des donnees valides
  assertTrue(form.next({ name: 'Alice', email: 'alice@test.com' }));
  assertEqual(form.getCurrentStep(), 1);

  // Reculer
  assertTrue(form.prev());
  assertEqual(form.getCurrentStep(), 0);

  // Impossible de reculer a l'etape 0
  assertFalse(form.prev());
});

test('createMultiStepForm - bloque si donnees invalides', () => {
  const form = createMultiStepForm([
    { fields: ['name'], schema: { name: { type: 'string', required: true, minLength: 2 } } },
    { fields: ['age'], schema: { age: { type: 'number', min: 18 } } },
  ]);

  // Ne peut pas avancer sans donnees valides
  assertFalse(form.next({ name: '' }));
  assertEqual(form.getCurrentStep(), 0);

  // canProceed verifie sans avancer
  assertFalse(form.canProceed({ name: 'A' })); // trop court
  assertTrue(form.canProceed({ name: 'Alice' }));
});

test('createMultiStepForm - getCurrentErrors et isComplete', () => {
  const form = createMultiStepForm([
    { fields: ['name'], schema: { name: { type: 'string', required: true } } },
    { fields: ['email'], schema: { email: { type: 'email', required: true } } },
  ]);

  const errors = form.getCurrentErrors({ name: '' });
  assertTrue(errors['name'].length > 0);

  // Passer toutes les etapes
  form.next({ name: 'Alice' });
  form.next({ email: 'alice@test.com' });
  assertTrue(form.isComplete());

  // Reset
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
  assertEqual(state.values['email'], ''); // inchange

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
