package dev.booknetwork.catalog.dto;

import dev.booknetwork.catalog.Genre;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookRequest(
        @NotBlank(message = "Title is required") @Size(max = 200) String title,
        @NotBlank(message = "Author is required") @Size(max = 200) String authorName,
        @Size(max = 20) String isbn,
        @Size(max = 2000) String synopsis,
        Genre genre,
        boolean shareable
) {

    public String isbnOrEmpty() {
        return isbn == null ? "" : isbn;
    }

    public String synopsisOrEmpty() {
        return synopsis == null ? "" : synopsis;
    }

    public Genre genreOrOther() {
        return genre == null ? Genre.OTHER : genre;
    }
}
