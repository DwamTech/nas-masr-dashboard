'use client';

import type { CSSProperties, PropsWithChildren, ReactNode, Ref } from 'react';
import styles from './FiltersCrudModal.module.css';

type AlertVariant = 'error' | 'success' | 'info';

function iconForVariant(variant: AlertVariant) {
    if (variant === 'success') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        );
    }

    if (variant === 'info') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
    );
}

export function FiltersCrudShell({
    children,
    onOverlayClick,
    align = 'center',
    contentRef,
    contentClassName,
    contentStyle,
}: PropsWithChildren<{
    onOverlayClick: () => void;
    align?: 'center' | 'start';
    contentRef?: Ref<HTMLDivElement>;
    contentClassName?: string;
    contentStyle?: CSSProperties;
}>) {
    return (
        <div
            className={styles.overlay}
            onClick={onOverlayClick}
            role="dialog"
            aria-modal="true"
            style={align === 'start' ? { alignItems: 'flex-start', padding: '1rem', overflowY: 'auto' } : undefined}
        >
            <div
                ref={contentRef}
                className={[styles.content, contentClassName].filter(Boolean).join(' ')}
                style={contentStyle}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function FiltersCrudHeader({
    title,
    subtitle,
    onClose,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    onClose: () => void;
}) {
    return (
        <div className={styles.header}>
            <div className={styles.titleWrap}>
                <h2 className={styles.title}>{title}</h2>
                {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            <button onClick={onClose} className={styles.iconButton} aria-label="إغلاق">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function FiltersCrudTabs({
    tabs,
}: {
    tabs: Array<{ key: string; label: string; active: boolean; onClick: () => void }>;
}) {
    return (
        <div className={styles.tabs}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`${styles.tab} ${tab.active ? styles.tabActive : ''}`}
                    onClick={tab.onClick}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export function FiltersCrudAlert({
    variant,
    title,
    children,
}: PropsWithChildren<{ variant: AlertVariant; title: string }>) {
    const variantClass =
        variant === 'error'
            ? styles.alertError
            : variant === 'success'
                ? styles.alertSuccess
                : styles.alertInfo;

    return (
        <div className={`${styles.alert} ${variantClass}`} role={variant === 'error' ? 'alert' : 'status'}>
            <div className={styles.alertIcon}>{iconForVariant(variant)}</div>
            <div>
                <strong className={styles.alertTitle}>{title}</strong>
                <div className={styles.alertText}>{children}</div>
            </div>
        </div>
    );
}

export function FiltersCrudCard({
    title,
    chip,
    muted = false,
    children,
}: PropsWithChildren<{ title: string; chip?: string; muted?: boolean }>) {
    return (
        <div className={`${styles.card} ${muted ? styles.cardMuted : ''}`}>
            {chip ? (
                <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>{title}</h4>
                    <span className={styles.chip}>{chip}</span>
                </div>
            ) : (
                <h4 className={styles.cardTitle}>{title}</h4>
            )}
            {children}
        </div>
    );
}

export function FiltersCrudFooter({
    onClose,
    disabled,
    label,
}: {
    onClose: () => void;
    disabled?: boolean;
    label?: string;
}) {
    return (
        <div className={styles.footer}>
            <button onClick={onClose} disabled={disabled} className={styles.footerButton}>
                {label || 'إغلاق'}
            </button>
        </div>
    );
}

export { styles as filtersCrudStyles };
