package dev.booknetwork.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.user.User;

/** BookMapper folds a Book plus its stats into the BookResponse API shape. */
class BookMapperTest {

    private static final UUID OWNER = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID VIEWER = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private Book book() {
        Book book = mock(Book.class);
        when(book.getId()).thenReturn(42L);
        when(book.getTitle()).thenReturn("The Test Book");
        when(book.getAuthorName()).thenReturn("A. Nonymous");
        when(book.getIsbn()).thenReturn("");
        when(book.getSynopsis()).thenReturn("");
        when(book.getGenre()).thenReturn(Genre.OTHER);
        when(book.isShareable()).thenReturn(true);
        when(book.isArchived()).thenReturn(false);
        when(book.isOwnedBy(VIEWER)).thenReturn(false);
        when(book.getCoverPath()).thenReturn(null);
        when(book.getOwner()).thenReturn(new User(OWNER, "owner@booknetwork.dev", "Owner", "Person"));
        return book;
    }

    private BookWithStats stats(long borrowCount) {
        Book book = book();
        BookWithStats stats = mock(BookWithStats.class);
        when(stats.getBook()).thenReturn(book);
        when(stats.getBorrowCount()).thenReturn(borrowCount);
        return stats;
    }

    @Test
    void mapsTheBorrowCountFromTheStats() {
        BookResponse response = BookMapper.toResponse(stats(3), VIEWER);

        assertThat(response.borrowCount()).isEqualTo(3);
    }

    @Test
    void defaultsTheBorrowCountToZeroWhenTheStatsCarryNone() {
        BookWithStats stats = mock(BookWithStats.class);
        Book book = book();
        when(stats.getBook()).thenReturn(book);

        BookResponse response = BookMapper.toResponse(stats, VIEWER);

        assertThat(response.borrowCount()).isZero();
    }

    @Test
    void keepsTheExistingComponentsUnchangedWhenAddingTheBorrowCount() {
        BookResponse response = BookMapper.toResponse(stats(7), VIEWER);

        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.title()).isEqualTo("The Test Book");
        assertThat(response.authorName()).isEqualTo("A. Nonymous");
        assertThat(response.genre()).isEqualTo(Genre.OTHER);
        assertThat(response.ownerId()).isEqualTo(OWNER.toString());
        assertThat(response.ownerName()).isEqualTo("Owner Person");
        assertThat(response.shareable()).isTrue();
        assertThat(response.archived()).isFalse();
        assertThat(response.rating()).isZero();
        assertThat(response.borrowed()).isFalse();
        assertThat(response.borrowedByMe()).isFalse();
        assertThat(response.mine()).isFalse();
        assertThat(response.hasCover()).isFalse();
        assertThat(response.wishlisted()).isFalse();
        assertThat(response.reservedByMe()).isFalse();
        assertThat(response.queueLength()).isZero();
        assertThat(response.borrowCount()).isEqualTo(7);
    }
}
