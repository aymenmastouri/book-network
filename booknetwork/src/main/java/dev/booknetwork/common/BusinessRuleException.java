package dev.booknetwork.common;

/**
 * A domain rule said no: borrowing your own book, returning what you never
 * borrowed, approving a return that has not happened. Maps to 409 with a
 * machine-readable code the frontend can translate.
 */
public class BusinessRuleException extends RuntimeException {

    private final String code;

    public BusinessRuleException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
