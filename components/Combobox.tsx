'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
    id: string;
    name: string;
}

interface ComboboxProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

export default function Combobox({ options, value, onChange, placeholder = 'Select an option', required = false }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Find the currently selected option's name to display
    const selectedOption = options.find(opt => opt.id === value);
    const displayValue = isOpen ? search : (selectedOption?.name || '');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* Hidden select for standard form submission / required validation */}
            <select
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
            >
                <option value="" disabled></option>
                {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>

            <div
                className="relative cursor-text"
                onClick={() => {
                    setIsOpen(true);
                    setSearch('');
                }}
            >
                <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400 pr-10"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch(''); // Clear search on focus to show all options
                    }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                            No matching options found.
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filteredOptions.map((opt) => (
                                <li
                                    key={opt.id}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${value === opt.id
                                            ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {opt.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
