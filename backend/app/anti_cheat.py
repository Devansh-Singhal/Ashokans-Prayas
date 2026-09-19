BASE_POINTS = 150


def credited_points(n_ur: int, outcome_weight: float = 1.0) -> tuple[int, float]:
    credited = int(round(BASE_POINTS * (1 / (1 + n_ur)) * outcome_weight))
    decay_pct = round((1 - credited / BASE_POINTS) * 100, 2) if BASE_POINTS else 0.0
    return credited, decay_pct
