package dev.booknetwork.reservation;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.booknetwork.reservation.dto.ReservationResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("books/{id}/reserve")
    public Long reserve(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return reservationService.reserve(id, jwt);
    }

    @DeleteMapping("books/{id}/reserve")
    public void cancel(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        reservationService.cancel(id, jwt);
    }

    @GetMapping("reservations/mine")
    public List<ReservationResponse> myReservations(@AuthenticationPrincipal Jwt jwt) {
        return reservationService.mine(jwt);
    }
}
