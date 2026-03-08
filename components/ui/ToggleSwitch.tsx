import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    ariaLabel?: string;
}

export function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    ariaLabel = 'Toggle switch'
}: ToggleSwitchProps) {
    const toggleClasses = [
        styles.toggle,
        checked ? styles.toggleChecked : styles.toggleUnchecked,
        disabled ? styles.toggleDisabled : ''
    ].filter(Boolean).join(' ');

    const thumbClasses = [
        styles.toggleThumb,
        checked ? styles.toggleThumbChecked : styles.toggleThumbUnchecked
    ].join(' ');

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={toggleClasses}
        >
            <span className={thumbClasses} />
        </button>
    );
}
