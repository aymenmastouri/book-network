package dev.booknetwork.catalog;

/** The fixed shelf taxonomy. Mirrors the CHECK constraint on books.genre. */
public enum Genre {
    CLASSIC,
    CRIME,
    SCIFI,
    FANTASY,
    ROMANCE,
    HISTORY,
    NONFICTION,
    OTHER
}
