package dev.booknetwork.catalog;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import dev.booknetwork.common.BusinessRuleException;

/**
 * Covers live on disk under a configured directory; the database stores only
 * the file name. Names are server-generated UUIDs — nothing from the upload
 * (not even the extension) reaches the filesystem path, so a crafted filename
 * cannot walk out of the directory.
 */
@Component
public class CoverStorage {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path directory;

    public CoverStorage(@Value("${booknetwork.covers.directory}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.directory);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create covers directory " + this.directory, e);
        }
    }

    public String store(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessRuleException("cover_type_unsupported",
                    "Cover must be a JPEG, PNG or WebP image");
        }
        String name = UUID.randomUUID() + extensionFor(contentType);
        try {
            file.transferTo(directory.resolve(name));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store cover", e);
        }
        return name;
    }

    public Optional<byte[]> load(String name) {
        Path path = directory.resolve(name).normalize();
        if (!path.startsWith(directory) || !Files.isReadable(path)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(path));
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public String contentTypeFor(String name) {
        if (name.endsWith(".png")) {
            return "image/png";
        }
        if (name.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
