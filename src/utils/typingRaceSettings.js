const DEFAULT_TEAM_RELAY_SETTINGS = {
    mode: 'team_relay',
    team_size: 4,
    scoring: 'team_fastest_time',
    source_text: "TeamWave об'єднує віддалені команди разом швидше за всіх",
    slots: [
        { slot: 0, label: 'Гравець 1', color: '#2563EB' },
        { slot: 1, label: 'Гравець 2', color: '#DB2777' },
        { slot: 2, label: 'Гравець 3', color: '#059669' },
        { slot: 3, label: 'Гравець 4', color: '#D97706' },
    ],
    segments: [
        { text: 'TeamWave', slot: 0 },
        { text: ' ', slot: null },
        { text: "об'єднує", slot: 1 },
        { text: ' ', slot: null },
        { text: 'віддалені', slot: 2 },
        { text: ' ', slot: null },
        { text: 'команди', slot: 2 },
        { text: ' ', slot: null },
        { text: 'разом', slot: 3 },
        { text: ' ', slot: null },
        { text: 'швидше', slot: 3 },
        { text: ' ', slot: null },
        { text: 'за', slot: 3 },
        { text: ' ', slot: null },
        { text: 'всіх', slot: 3 },
    ],
    rules: [
        'Один учасник створює команду, інші надсилають запит капітану',
        'Капітан приймає або відхиляє запити на вступ',
        'Перемагає команда з найменшим сумарним часом проходження',
    ],
};

function normalizeTypingRaceSettings(settings) {
    const raw = settings && typeof settings === 'object' ? settings : {};
    const hasSegments = Array.isArray(raw.segments) && raw.segments.length > 0;
    const isRelay = raw.mode === 'team_relay' && hasSegments;

    if (isRelay) {
        return {
            ...DEFAULT_TEAM_RELAY_SETTINGS,
            ...raw,
            team_size: Number(raw.team_size) || DEFAULT_TEAM_RELAY_SETTINGS.team_size,
            slots: raw.slots?.length ? raw.slots : DEFAULT_TEAM_RELAY_SETTINGS.slots,
            segments: raw.segments,
            rules: raw.rules?.length ? raw.rules : DEFAULT_TEAM_RELAY_SETTINGS.rules,
        };
    }

    return {
        ...DEFAULT_TEAM_RELAY_SETTINGS,
        ...raw,
        mode: 'team_relay',
        team_size: Number(raw.team_size) || DEFAULT_TEAM_RELAY_SETTINGS.team_size,
    };
}

module.exports = {
    DEFAULT_TEAM_RELAY_SETTINGS,
    normalizeTypingRaceSettings,
};
