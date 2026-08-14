import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

export function passwordMatchValidator(control: AbstractControl, field: FormlyFieldConfig): ValidationErrors | null {
    const { password, confirmPassword } = control.value;
    // avoid displaying the message error when values are empty
    if (!confirmPassword || !password) {
        return null;
    }

    if (confirmPassword === password) {
        return null;
    }
    return {
        'passwordMatch': true
    }
}

export function passwordStrengthValidator(control: AbstractControl): any {
    const value: string = control.value || '';

    if (!value) {
        return null;
    }

    const upperCaseCharacters = new RegExp("[A-Z]+");
    if (upperCaseCharacters.test(value) === false) {
        return { 'passwordStrengthUpperCase': true };
    }

    const smallCharacter = new RegExp("(?=.*[a-z])");
    if (smallCharacter.test(value) === false) {
        return { 'passwordStrengthSmallChar': true };
    }

    const specialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (specialCharacters.test(value) === false) {
        return { "passwordStrengthSpecialCase": true };
    }


    const numberCharacters = /[0-9]+/g
    if (numberCharacters.test(value) === false) {
        return { 'passwordStrengthInteger': true };
    }

    if (value.length < 8) {
        return { 'passwordStrengthMinLength': true };
    }

    return null;
}

export function emailPatternValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
        return null; // Don't validate if field is empty (required validator will handle that)
    }

    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (emailPattern.test(value)) {
        return null;
    }

    return { emailPattern: true };
}

export function numberOnlyValidator(control: AbstractControl): any {
    const value: string = control.value || '';

    if (!value) {
        return null;
    }

    const numberPattern = /^\d+$/;

    if (numberPattern.test(value) === false) {
        return { 'numbersOnly': true };
    }

    return null;
}