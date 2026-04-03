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
    searchable?: boolean;
}

export default function Combobox({ options, value, onChange, placeholder = 'Select an option', required = false, searchable = true }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Find the currently selected option's name to display
    const selectedOption = options.find(opt => opt.id === value);
    const displayValue = isOpen ? search : (selectedOption?.name || '');

    const wasOpenRef = useRef(false);

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
                className="relative"
                onMouseDown={() => {
                    wasOpenRef.current = isOpen;
                }}
                onClick={() => {
                    if (wasOpenRef.current) {
                        // If it was already open, and we're not using it as a search field currently, close it
                        if (!searchable || search === '') {
                            setIsOpen(false);
                        }
                    } else {
                        setIsOpen(true);
                        if (searchable) setSearch('');
                    }
                }}
            >
                <input
                    type="text"
                    className={`w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400 pr-10 cursor-pointer ${searchable ? 'sm:cursor-text' : ''}`}
                    placeholder={placeholder}
                    value={displayValue}
                    readOnly={!searchable}
                    onChange={(e) => {
                        if (searchable) {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }
                    }}
                    onFocus={() => {
                        if (!isOpen) {
                            setIsOpen(true);
                            if (searchable) setSearch('');
                        }
                    }}
                />
                <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
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
