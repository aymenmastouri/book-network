package dev.booknetwork.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("me")
@Tag(name = "profile")
public class UserController {

    public record ProfileResponse(String email, String firstName, String lastName, String fullName) {}

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.resolve(jwt);
        return new ProfileResponse(user.getEmail(), user.getFirstName(), user.getLastName(), user.fullName());
    }
}
