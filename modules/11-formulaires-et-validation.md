# Module 11 — Formulaires et validation

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 60 min        | [Lab 11](../labs/lab-11-formulaires-validation/) | [Quiz 11](../quizzes/quiz-11-formulaires.html) |

## Objectifs

- Intégrer React Hook Form avec React Native via Controller
- Définir des schemas de validation Zod (string, number, email, custom)
- Gérer les modes de validation (onBlur, onChange, onSubmit)
- Implementer un formulaire multi-étapes (wizard pattern)
- Afficher les erreurs (inline, toast, summary)
- Maîtriser les patterns TextInput (secure entry, clavier numérique, masques)
- Gérer le clavier (KeyboardAvoidingView, dismiss on tap)

---

## React Hook Form avec React Native

### Pourquoi React Hook Form

React Hook Form (RHF) est la solution standard pour les formulaires React. Son approche non-controlee reduit les re-renders. En React Native, on utilise `Controller` car les composants natifs ne supportent pas `ref` et `register` comme le DOM.

### Installation

```bash
npx expo install react-hook-form zod @hookform/resolvers
```

### Formulaire basique avec Controller

```tsx
import { useForm, Controller } from 'react-hook-form';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

interface LoginForm {
  email: string;
  password: string;
}

function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('Login:', data);
    // Appel API...
  };

  return (
    <View style={styles.container}>
      {/* Champ Email */}
      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email requis',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email invalide',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      {/* Champ Password */}
      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Mot de passe requis',
          minLength: {
            value: 8,
            message: 'Minimum 8 caracteres',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </Text>
      </Pressable>
    </View>
  );
}
```

### Controller vs register

| Aspect | `register` (Web) | `Controller` (React Native) |
|--------|-------------------|----------------------------|
| Mécanisme | Attache `ref` au DOM élément | Wrapper controlant `value`, `onChange`, `onBlur` |
| Re-renders | Aucun (non-controle) | Re-rend le Controller quand la valeur change |
| Usage | `<input {...register('name')} />` | `<Controller render={({ field }) => ...} />` |
| Obligatoire en RN | Non applicable | Oui, car pas de `ref.current.value` |

En React Native, `Controller` est le seul choix. Pour optimiser les re-renders, RHF ne re-rend que le Controller concerne, pas tout le formulaire.

---

## Validation avec Zod

### Pourquoi Zod

Zod permet de définir un schema de validation type-safe. L'intégration avec RHF via `@hookform/resolvers` est transparente : le schema Zod devient le `resolver` du formulaire.

### Schema basique

```tsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// --- Schema ---
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Format email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caracteres')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
});

// Inferer le type depuis le schema
type LoginFormData = z.infer<typeof loginSchema>;

// --- Formulaire ---
function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // errors est automatiquement type selon le schema
  // errors.email?.message -> string | undefined
}
```

### Schemas avances

```tsx
// Inscription avec confirmation de mot de passe
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Minimum 2 caracteres')
      .max(50, 'Maximum 50 caracteres'),
    lastName: z
      .string()
      .min(2, 'Minimum 2 caracteres')
      .max(50, 'Maximum 50 caracteres'),
    email: z
      .string()
      .min(1, 'Email requis')
      .email('Format email invalide'),
    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, 'Numero de telephone invalide')
      .optional(),
    password: z
      .string()
      .min(8, 'Minimum 8 caracteres')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractere special'),
    confirmPassword: z.string(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis')
      .refine(
        (date) => new Date(date) < new Date(),
        'La date doit etre dans le passe'
      ),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'Vous devez accepter les CGU'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'], // le champ ou afficher l'erreur
  });

type RegisterFormData = z.infer<typeof registerSchema>;
```

### Validateurs personnalises

```tsx
// Schema d'adresse avec validation conditionnelle
const addressSchema = z.object({
  street: z.string().min(5, 'Adresse trop courte'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().regex(
    /^[0-9]{5}$/,
    'Code postal invalide (5 chiffres)'
  ),
  country: z.enum(['FR', 'BE', 'CH', 'LU'], {
    errorMap: () => ({ message: 'Pays non supporte' }),
  }),
  // Champ conditionnel
  state: z.string().optional(),
});

// Validation asynchrone (ex: verifier unicite email)
const asyncEmailSchema = z.string().email().refine(
  async (email) => {
    const response = await fetch(`/api/check-email?email=${email}`);
    const { available } = await response.json();
    return available;
  },
  { message: 'Cet email est deja utilise' },
);

// Transformer la valeur
const priceSchema = z
  .string()
  .transform((val) => parseFloat(val.replace(',', '.')))
  .refine((val) => !isNaN(val) && val > 0, 'Prix invalide');
```

---

## Modes de validation

React Hook Form supporte plusieurs modes de declenchement de la validation.

### Les 4 modes

```tsx
const { control, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onBlur',        // Valide quand le champ perd le focus
  // mode: 'onChange',    // Valide a chaque frappe (plus agressif)
  // mode: 'onSubmit',   // Valide uniquement a la soumission (defaut)
  // mode: 'onTouched',  // Valide au premier blur, puis a chaque change
  // mode: 'all',        // Valide au blur ET au change
});
```

### Recommandations par cas d'usage

| Mode | Quand l'utiliser | Avantages | Inconvenients |
|------|-----------------|-----------|---------------|
| `onSubmit` | Formulaires simples, login | Pas de feedback intrusif | Erreurs tardives |
| `onBlur` | Formulaires moyens | Feedback à la sortie du champ | Delai avant feedback |
| `onTouched` | Meilleur compromis | Feedback au blur, puis réactif | Leger overhead |
| `onChange` | Champs critiques | Feedback instantane | Re-renders frequents |
| `all` | Formulaires complexes | Maximum de feedback | Plus de re-renders |

### Validation champ par champ

```tsx
const { control, trigger, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onBlur',
});

// Valider un seul champ manuellement
const validateEmail = async () => {
  const result = await trigger('email');
  console.log('Email valide :', result);
};

// Valider plusieurs champs
const validateStep = async () => {
  const result = await trigger(['firstName', 'lastName', 'email']);
  return result; // true si tous valides
};
```

---

## Formulaire multi-étapes (wizard)

### Architecture

```tsx
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { z } from 'zod';

// Schema par etape
const step1Schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
});

const step2Schema = z.object({
  street: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/),
  country: z.enum(['FR', 'BE', 'CH']),
});

const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.string().regex(/^\d{3}$/),
});

// Schema complet (merge)
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FullFormData = z.infer<typeof fullSchema>;

// Schemas par etape pour la validation partielle
const stepSchemas = [step1Schema, step2Schema, step3Schema];
```

### Composant Wizard

```tsx
function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<FullFormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '', lastName: '', email: '',
      street: '', city: '', postalCode: '', country: 'FR',
      cardNumber: '', expiry: '', cvv: '',
    },
  });

  const { trigger, handleSubmit, formState: { errors } } = methods;

  // Valider uniquement les champs de l'etape courante
  const nextStep = async () => {
    const fieldsForStep = Object.keys(stepSchemas[currentStep].shape) as Array<
      keyof FullFormData
    >;
    const isValid = await trigger(fieldsForStep);
    if (isValid) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => setCurrentStep((s) => Math.max(0, s - 1));

  const onSubmit = (data: FullFormData) => {
    console.log('Formulaire complet:', data);
  };

  const steps = [
    <Step1 key="step1" />,
    <Step2 key="step2" />,
    <Step3 key="step3" />,
  ];

  return (
    <FormProvider {...methods}>
      <View style={styles.container}>
        {/* Indicateur de progression */}
        <StepIndicator
          current={currentStep}
          total={steps.length}
          labels={['Identite', 'Adresse', 'Paiement']}
        />

        {/* Contenu de l'etape */}
        {steps[currentStep]}

        {/* Navigation */}
        <View style={styles.nav}>
          {currentStep > 0 && (
            <Pressable style={styles.btnSecondary} onPress={prevStep}>
              <Text>Precedent</Text>
            </Pressable>
          )}
          {currentStep < steps.length - 1 ? (
            <Pressable style={styles.btnPrimary} onPress={nextStep}>
              <Text style={styles.btnText}>Suivant</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.btnPrimary}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.btnText}>Valider</Text>
            </Pressable>
          )}
        </View>
      </View>
    </FormProvider>
  );
}
```

### Composants d'étapes

```tsx
// Etape 1 : Identite
function Step1() {
  const { control, formState: { errors } } = useFormContext<FullFormData>();

  return (
    <View>
      <Text style={styles.title}>Vos informations</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Prenom"
            error={errors.firstName?.message}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoComplete="given-name"
            textContentType="givenName"
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Nom"
            error={errors.lastName?.message}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoComplete="family-name"
            textContentType="familyName"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Email"
            error={errors.email?.message}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        )}
      />
    </View>
  );
}
```

### Composant FormField réutilisable

```tsx
interface FormFieldProps {
  label: string;
  error?: string;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  value: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  autoComplete?: TextInput['props']['autoComplete'];
  textContentType?: TextInput['props']['textContentType'];
  multiline?: boolean;
  maxLength?: number;
}

function FormField({
  label,
  error,
  onBlur,
  onChangeText,
  value,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          inputProps.multiline && styles.inputMultiline,
        ]}
        onBlur={onBlur}
        onChangeText={onChangeText}
        value={value}
        placeholderTextColor="#999"
        {...inputProps}
      />
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
```

### Indicateur de progression

```tsx
function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <View style={stepStyles.container}>
      {labels.map((label, index) => (
        <View key={label} style={stepStyles.step}>
          <View
            style={[
              stepStyles.circle,
              index < current && stepStyles.circleDone,
              index === current && stepStyles.circleCurrent,
            ]}
          >
            <Text style={stepStyles.circleText}>
              {index < current ? '\u2713' : index + 1}
            </Text>
          </View>
          <Text
            style={[
              stepStyles.label,
              index === current && stepStyles.labelCurrent,
            ]}
          >
            {label}
          </Text>
          {index < total - 1 && <View style={stepStyles.line} />}
        </View>
      ))}
    </View>
  );
}
```

---

## Patterns d'affichage des erreurs

### Erreur inline (recommande)

```tsx
// L'erreur s'affiche directement sous le champ concerne
<View>
  <TextInput
    style={[styles.input, error && styles.inputError]}
    // ...
  />
  {error && (
    <Text
      style={styles.error}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      {error}
    </Text>
  )}
</View>
```

### Résumé d'erreurs en haut du formulaire

```tsx
function ErrorSummary({ errors }: { errors: Record<string, { message?: string }> }) {
  const errorList = Object.entries(errors).filter(([, err]) => err.message);

  if (errorList.length === 0) return null;

  return (
    <View
      style={styles.errorSummary}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.errorSummaryTitle}>
        {errorList.length} erreur{errorList.length > 1 ? 's' : ''} a corriger :
      </Text>
      {errorList.map(([field, error]) => (
        <Text key={field} style={styles.errorSummaryItem}>
          - {error.message}
        </Text>
      ))}
    </View>
  );
}

// Usage
function MyForm() {
  const { formState: { errors } } = useFormContext();
  return (
    <ScrollView>
      <ErrorSummary errors={errors} />
      {/* ... champs ... */}
    </ScrollView>
  );
}
```

### Toast pour les erreurs serveur

```tsx
import Toast from 'react-native-toast-message';

const onSubmit = async (data: FormData) => {
  try {
    await api.post('/register', data);
    Toast.show({
      type: 'success',
      text1: 'Inscription reussie',
      text2: 'Bienvenue !',
    });
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Erreur serveur',
      text2: error instanceof Error ? error.message : 'Reessayez',
    });
  }
};
```

---

## Patterns TextInput

### Saisie securisee (mot de passe)

```tsx
function PasswordInput({
  value,
  onChangeText,
  onBlur,
  error,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Mot de passe</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={!isVisible}
          autoComplete="password"
          textContentType="password"
          autoCapitalize="none"
        />
        <Pressable
          style={styles.toggleButton}
          onPress={() => setIsVisible(!isVisible)}
          accessibilityLabel={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          accessibilityRole="button"
        >
          <Text>{isVisible ? 'Masquer' : 'Voir'}</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Indicateur de force */}
      <PasswordStrength password={value} />
    </View>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const labels = ['Tres faible', 'Faible', 'Moyen', 'Fort', 'Tres fort'];
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#198754'];

  if (!password) return null;

  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.barContainer}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i < strength ? colors[strength - 1] : '#333' },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color: colors[strength - 1] }]}>
        {labels[strength - 1] || ''}
      </Text>
    </View>
  );
}
```

### Clavier numérique

```tsx
// Telephone
<TextInput
  keyboardType="phone-pad"     // Clavier telephone
  autoComplete="tel"
  textContentType="telephoneNumber"
  maxLength={15}
/>

// Montant
<TextInput
  keyboardType="decimal-pad"   // Chiffres + virgule/point
  returnKeyType="done"
/>

// Code postal
<TextInput
  keyboardType="number-pad"    // Chiffres uniquement
  maxLength={5}
/>

// Recherche
<TextInput
  keyboardType="default"
  returnKeyType="search"
  onSubmitEditing={handleSearch}
/>
```

### Masque de saisie

```tsx
// Masque pour carte bancaire : XXXX XXXX XXXX XXXX
function CreditCardInput({ value, onChangeText, ...props }: TextInputProps) {
  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleChange = (text: string) => {
    onChangeText?.(formatCardNumber(text));
  };

  return (
    <TextInput
      {...props}
      value={value}
      onChangeText={handleChange}
      keyboardType="number-pad"
      maxLength={19} // 16 chiffres + 3 espaces
      placeholder="1234 5678 9012 3456"
    />
  );
}

// Masque pour date d'expiration : MM/YY
function ExpiryInput({ value, onChangeText, ...props }: TextInputProps) {
  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  return (
    <TextInput
      {...props}
      value={value}
      onChangeText={(text) => onChangeText?.(formatExpiry(text))}
      keyboardType="number-pad"
      maxLength={5}
      placeholder="MM/YY"
    />
  );
}

// Masque generique reutilisable
function useMaskedInput(pattern: string) {
  // pattern: '#### #### #### ####' ou '##/##' ou '+## # ## ## ## ##'
  // # = chiffre, A = lettre, * = n'importe quoi

  const applyMask = useCallback(
    (text: string): string => {
      const rawChars = text.replace(/[^a-zA-Z0-9]/g, '');
      let result = '';
      let rawIndex = 0;

      for (let i = 0; i < pattern.length && rawIndex < rawChars.length; i++) {
        const maskChar = pattern[i];
        if (maskChar === '#') {
          if (/\d/.test(rawChars[rawIndex])) {
            result += rawChars[rawIndex];
            rawIndex++;
          } else {
            break;
          }
        } else if (maskChar === 'A') {
          if (/[a-zA-Z]/.test(rawChars[rawIndex])) {
            result += rawChars[rawIndex];
            rawIndex++;
          } else {
            break;
          }
        } else if (maskChar === '*') {
          result += rawChars[rawIndex];
          rawIndex++;
        } else {
          result += maskChar; // separateur litteral
        }
      }

      return result;
    },
    [pattern],
  );

  const unmask = useCallback((text: string): string => {
    return text.replace(/[^a-zA-Z0-9]/g, '');
  }, []);

  return { applyMask, unmask };
}
```

---

## Gestion du clavier

### KeyboardAvoidingView

```tsx
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';

function FormScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Formulaire ici */}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
```

### Proprietes importantes

```tsx
// behavior : comment le layout s'adapte au clavier
// - 'padding' : ajoute du padding en bas (iOS)
// - 'height' : reduit la hauteur (Android)
// - 'position' : deplace la vue vers le haut

// keyboardVerticalOffset : offset supplementaire
// Utile quand il y a un header de navigation
// Sur iOS : hauteur du header (88 = header standard)
// Sur Android : souvent 0

// keyboardShouldPersistTaps : sur ScrollView
// - 'handled' : le tap ferme le clavier sauf si le tap est
//   gere par un composant interactif (recommande)
// - 'always' : le clavier ne se ferme jamais au tap
// - 'never' : le clavier se ferme a chaque tap
```

### Navigation entre champs avec returnKeyType

```tsx
function LoginForm() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <View>
      <TextInput
        ref={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false} // ne pas perdre le focus
      />
      <TextInput
        ref={passwordRef}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </View>
  );
}
```

### Hook personnalise pour le clavier

```tsx
import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent } from 'react-native';

function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setIsVisible(true);
      setHeight(e.endCoordinates.height);
    };

    const onHide = () => {
      setIsVisible(false);
      setHeight(0);
    };

    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return { isVisible, height, dismiss: Keyboard.dismiss };
}

// Usage
function MyForm() {
  const { isVisible, dismiss } = useKeyboard();

  return (
    <View>
      {/* ... formulaire ... */}
      {isVisible && (
        <Pressable onPress={dismiss} style={styles.dismissButton}>
          <Text>Fermer le clavier</Text>
        </Pressable>
      )}
    </View>
  );
}
```

---

## Formulaire d'adresse complet

```tsx
const addressSchema = z.object({
  street: z.string().min(5, 'Adresse trop courte'),
  complement: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Code postal : 5 chiffres'),
  city: z.string().min(2, 'Ville requise'),
  country: z.enum(['FR', 'BE', 'CH', 'LU']),
});

type AddressFormData = z.infer<typeof addressSchema>;

function AddressForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: AddressFormData) => void;
  defaultValues?: Partial<AddressFormData>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      complement: '',
      postalCode: '',
      city: '',
      country: 'FR',
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  const country = watch('country');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="street"
          render={({ field }) => (
            <FormField
              label="Adresse"
              error={errors.street?.message}
              {...field}
              autoComplete="street-address"
              textContentType="streetAddressLine1"
            />
          )}
        />

        <Controller
          control={control}
          name="complement"
          render={({ field }) => (
            <FormField
              label="Complement (optionnel)"
              error={errors.complement?.message}
              {...field}
              textContentType="streetAddressLine2"
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.col4}>
            <Controller
              control={control}
              name="postalCode"
              render={({ field }) => (
                <FormField
                  label="Code postal"
                  error={errors.postalCode?.message}
                  {...field}
                  keyboardType="number-pad"
                  maxLength={5}
                  autoComplete="postal-code"
                  textContentType="postalCode"
                />
              )}
            />
          </View>

          <View style={styles.col8}>
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <FormField
                  label="Ville"
                  error={errors.city?.message}
                  {...field}
                  autoComplete="address-level2"
                  textContentType="addressCity"
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="country"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Pays</Text>
              <View style={styles.pickerContainer}>
                {(['FR', 'BE', 'CH', 'LU'] as const).map((code) => (
                  <Pressable
                    key={code}
                    style={[
                      styles.pickerOption,
                      value === code && styles.pickerOptionSelected,
                    ]}
                    onPress={() => onChange(code)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        value === code && styles.pickerTextSelected,
                      ]}
                    >
                      {{ FR: 'France', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg' }[code]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.country && (
                <Text style={styles.errorText}>{errors.country.message}</Text>
              )}
            </View>
          )}
        />

        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitText}>Enregistrer l'adresse</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

---

## watch, setValue, reset

### watch : observer les changements

```tsx
const { watch, control } = useForm<FormData>();

// Observer un champ
const email = watch('email');

// Observer plusieurs champs
const [firstName, lastName] = watch(['firstName', 'lastName']);

// Effet reactif
useEffect(() => {
  if (email && email.endsWith('@company.com')) {
    // Pre-remplir des champs pour les emails internes
    setValue('role', 'employee');
  }
}, [email]);
```

### setValue : modifier un champ programmatiquement

```tsx
const { setValue, trigger } = useForm<FormData>();

// Remplir depuis la geolocalisation
const fillFromLocation = async () => {
  const location = await getCurrentPosition();
  const address = await reverseGeocode(location);

  setValue('street', address.street, { shouldValidate: true });
  setValue('city', address.city, { shouldValidate: true });
  setValue('postalCode', address.postalCode, { shouldValidate: true });
};

// Remplir depuis un autocomplete
const onAddressSelect = (suggestion: AddressSuggestion) => {
  setValue('street', suggestion.street);
  setValue('city', suggestion.city);
  setValue('postalCode', suggestion.postalCode);
  trigger(['street', 'city', 'postalCode']); // revalider
};
```

### reset : reinitialiser le formulaire

```tsx
const { reset, handleSubmit } = useForm<FormData>();

// Apres soumission reussie
const onSubmit = async (data: FormData) => {
  await api.post('/submit', data);
  reset(); // remet toutes les valeurs par defaut
};

// Reinitialiser avec de nouvelles valeurs (edition)
useEffect(() => {
  if (existingData) {
    reset(existingData);
  }
}, [existingData]);
```

---

## Accessibilité des formulaires

```tsx
// Chaque champ doit avoir :
<View>
  {/* Label lie au champ */}
  <Text
    nativeID="email-label"
    style={styles.label}
  >
    Email
  </Text>

  <TextInput
    accessibilityLabel="Email"
    accessibilityLabelledBy="email-label"
    accessibilityHint="Saisissez votre adresse email"
    accessibilityState={{
      disabled: isSubmitting,
    }}
    // ...
  />

  {/* Erreur annoncee par le lecteur d'ecran */}
  {error && (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.error}
    >
      {error}
    </Text>
  )}
</View>

// Bouton de soumission
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Envoyer le formulaire"
  accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
  onPress={handleSubmit(onSubmit)}
  disabled={isSubmitting}
>
  <Text>{isSubmitting ? 'Envoi...' : 'Envoyer'}</Text>
</Pressable>
```

---

## Formulaire d'inscription complet (multi-étapes)

Voici le flux complet d'un formulaire d'inscription en 3 étapes, avec validation Zod, RHF et patterns d'erreurs.

```tsx
// stores/useRegistrationStore.ts
import { create } from 'zustand';

interface RegistrationStore {
  step: number;
  formData: Partial<FullFormData>;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<FullFormData>) => void;
  reset: () => void;
}

const useRegistrationStore = create<RegistrationStore>((set) => ({
  step: 0,
  formData: {},
  setStep: (step) => set({ step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  reset: () => set({ step: 0, formData: {} }),
}));
```

```tsx
// screens/RegistrationScreen.tsx
function RegistrationScreen() {
  const { step, formData, setStep, updateFormData, reset } =
    useRegistrationStore();

  const methods = useForm<FullFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: formData as FullFormData,
    mode: 'onTouched',
  });

  // Persister les valeurs a chaque changement d'etape
  const handleNext = async () => {
    const fields = Object.keys(stepSchemas[step].shape) as Array<keyof FullFormData>;
    const isValid = await methods.trigger(fields);

    if (isValid) {
      updateFormData(methods.getValues());
      setStep(step + 1);
    }
  };

  const handleSubmit = async (data: FullFormData) => {
    try {
      await api.post('/register', data);
      reset();
      navigation.navigate('Welcome');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'L\'inscription a echoue',
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <StepIndicator
                current={step}
                total={3}
                labels={['Identite', 'Adresse', 'Compte']}
              />

              {step === 0 && <IdentityStep />}
              {step === 1 && <AddressStep />}
              {step === 2 && <AccountStep />}

              <View style={styles.buttons}>
                {step > 0 && (
                  <Pressable onPress={() => setStep(step - 1)}>
                    <Text>Retour</Text>
                  </Pressable>
                )}
                {step < 2 ? (
                  <Pressable onPress={handleNext}>
                    <Text>Suivant</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={methods.handleSubmit(handleSubmit)}>
                    <Text>Creer mon compte</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
  );
}
```

---

## Bonnes pratiques

### 1. Toujours utiliser un schema Zod (pas les rules inline)

```tsx
// BON : schema centralise, reutilisable, type-safe
const schema = z.object({ email: z.string().email() });
useForm({ resolver: zodResolver(schema) });

// EVITER : rules inline, pas de type inference
<Controller rules={{ required: true, pattern: /.../ }} />
```

### 2. Mode `onTouched` par defaut

C'est le meilleur compromis : pas d'erreur avant l'interaction, puis réactif.

### 3. `autoComplete` et `textContentType` sur chaque champ

```tsx
// Email
autoComplete="email" textContentType="emailAddress"

// Mot de passe
autoComplete="password" textContentType="password"

// Nouveau mot de passe
autoComplete="password-new" textContentType="newPassword"

// Prenom
autoComplete="given-name" textContentType="givenName"
```

Cela active l'auto-remplissage natif (iOS Keychain, Google Autofill).

### 4. ScrollView avec `keyboardShouldPersistTaps="handled"`

Sinon, taper sur un bouton pendant que le clavier est visible ferme le clavier au lieu d'activer le bouton.

### 5. Composant FormField réutilisable

Ne pas dupliquer le pattern Controller + TextInput + erreur dans chaque formulaire.

---

## Résumé

| Concept | A retenir |
|---------|-----------|
| Controller | Obligatoire en React Native (pas de `register`) |
| Zod + resolver | Schema type-safe, inference automatique du type |
| Mode de validation | `onTouched` = meilleur compromis UX |
| Multi-étapes | `trigger(fieldsOfStep)` pour validation partielle |
| Erreurs | Inline sous le champ + `accessibilityRole="alert"` |
| Masques | Formater dans `onChangeText`, limiter avec `maxLength` |
| Clavier | `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` |
| Accessibilité | `accessibilityLabel`, `accessibilityLabelledBy`, `accessibilityRole="alert"` |

---

## Ressources

- React Hook Form : https://react-hook-form.com/
- Zod : https://zod.dev/
- @hookform/resolvers : https://github.com/react-hook-form/resolvers
- KeyboardAvoidingView : https://reactnative.dev/docs/keyboardavoidingview

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 11 formulaires](../screencasts/screencast-11-formulaires.md)
2. **Lab** : [lab-11-formulaires-validation](../labs/lab-11-formulaires-validation/README)
3. **Quiz** : [quiz 11 formulaires](../quizzes/quiz-11-formulaires.html)
:::
