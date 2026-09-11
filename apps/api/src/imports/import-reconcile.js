/**
 * After a successful single-ward UPDATE import, soft-delete surveys in that
 * ward that were not inserted/updated by the job so DB count matches the file.
 *
 * Never reconcile for SKIP/CREATE, multi-ward files, failed imports, or empty
 * touch sets — those paths must not disturb other wards or partial uploads.
 */
export function shouldReconcileWardAfterImport(input) {
    if (input.duplicateStrategy !== "UPDATE")
        return null;
    if (input.failedRows !== 0)
        return null;
    if (input.touchedSurveyIds.size === 0)
        return null;
    if (input.wardIdsSeen.size !== 1)
        return null;
    const [wardId] = input.wardIdsSeen;
    return wardId ?? null;
}
/**
 * Cap auto-prune so a small/partial ward UPDATE cannot wipe the ward.
 * Allows small leftover gaps (e.g. 1441 vs 1439) while blocking mass deletes.
 */
export function shouldPruneOrphanCount(orphanCount, keptCount) {
    if (orphanCount <= 0)
        return false;
    const maxOrphans = Math.max(10, Math.ceil(keptCount * 0.02));
    return orphanCount <= maxOrphans;
}
export function orphanSurveyWhere(wardId, keepSurveyIds) {
    return {
        wardId,
        deletedAt: null,
        status: { not: "DELETED" },
        id: { notIn: [...keepSurveyIds] },
    };
}
