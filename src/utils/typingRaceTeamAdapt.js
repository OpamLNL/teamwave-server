function getOccupiedSlots(members) {
    return [...new Set(
        (members || [])
            .map((member) => Number(member.slot_index))
            .filter((slot) => Number.isInteger(slot) && slot >= 0)
    )].sort((a, b) => a - b);
}

function remapSlotForTeam(originalSlot, occupiedSlots) {
    const slot = Number(originalSlot);
    if (!occupiedSlots.length) return slot;
    if (occupiedSlots.includes(slot)) return slot;
    return occupiedSlots[slot % occupiedSlots.length];
}

function adaptTypingSettingsForTeam(settings, members) {
    const base = settings && typeof settings === 'object' ? settings : {};
    const occupiedSlots = getOccupiedSlots(members);
    const configuredSize = Number(base.team_size) || base.slots?.length || 4;

    if (!occupiedSlots.length || occupiedSlots.length >= configuredSize) {
        return base;
    }

    const memberBySlot = new Map(
        (members || []).map((member) => [Number(member.slot_index), member])
    );

    const adaptedSegments = (base.segments || []).map((segment) => {
        if (segment.slot == null) {
            return { ...segment };
        }
        return {
            ...segment,
            slot: remapSlotForTeam(segment.slot, occupiedSlots),
        };
    });

    const adaptedSlots = (base.slots || [])
        .filter((slot) => occupiedSlots.includes(Number(slot.slot)))
        .map((slot) => {
            const member = memberBySlot.get(Number(slot.slot));
            const playerNumber = occupiedSlots.indexOf(Number(slot.slot)) + 1;
            return {
                ...slot,
                label: member?.name || `Гравець ${playerNumber}`,
            };
        });

    return {
        ...base,
        team_size: occupiedSlots.length,
        slots: adaptedSlots,
        segments: adaptedSegments,
        occupied_slots: occupiedSlots,
    };
}

module.exports = {
    getOccupiedSlots,
    remapSlotForTeam,
    adaptTypingSettingsForTeam,
};
