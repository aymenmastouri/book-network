package dev.booknetwork.user;

import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves the caller from a verified Keycloak token, creating or refreshing
 * the local mirror row as a side effect. Every request path that needs "who is
 * asking" goes through here — there is no second source of identity.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User resolve(Jwt jwt) {
        UUID id = UUID.fromString(jwt.getSubject());
        String email = claim(jwt, "email");
        String firstName = claim(jwt, "given_name");
        String lastName = claim(jwt, "family_name");
        return userRepository.findById(id)
                .map(user -> refresh(user, email, firstName, lastName))
                .orElseGet(() -> userRepository.save(new User(id, email, firstName, lastName)));
    }

    private User refresh(User user, String email, String firstName, String lastName) {
        if (!email.isEmpty() && !email.equals(user.getEmail())) {
            user.setEmail(email);
        }
        if (!firstName.equals(user.getFirstName())) {
            user.setFirstName(firstName);
        }
        if (!lastName.equals(user.getLastName())) {
            user.setLastName(lastName);
        }
        return user;
    }

    private static String claim(Jwt jwt, String name) {
        String value = jwt.getClaimAsString(name);
        return value == null ? "" : value.trim();
    }
}
