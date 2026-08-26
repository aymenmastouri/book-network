package dev.booknetwork.feedback;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.booknetwork.common.PageResponse;
import dev.booknetwork.feedback.dto.FeedbackRequest;
import dev.booknetwork.feedback.dto.FeedbackResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@Tag(name = "feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("feedbacks")
    public Long give(@Valid @RequestBody FeedbackRequest request, @AuthenticationPrincipal Jwt jwt) {
        return feedbackService.give(request, jwt);
    }

    @GetMapping("books/{id}/feedbacks")
    public PageResponse<FeedbackResponse> forBook(@PathVariable Long id,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size,
                                                  @AuthenticationPrincipal Jwt jwt) {
        return feedbackService.forBook(id, page, size, jwt);
    }
}
