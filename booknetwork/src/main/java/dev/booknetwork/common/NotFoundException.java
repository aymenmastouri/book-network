package dev.booknetwork.common;

/** Requested entity does not exist (or is invisible to the caller). Maps to 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
