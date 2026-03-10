from typing import Literal
from pydantic import BaseModel, Field

ValidAirline = Literal["AA", "AS", "B6", "DL", "EV", "F9", "HA", "MQ", "NK", "OO", "UA", "US", "VX", "WN"]


class FlightRequest(BaseModel):
    AIRLINE: ValidAirline
    ORIGIN_AIRPORT: str = Field(min_length=3, max_length=3)
    DESTINATION_AIRPORT: str = Field(min_length=3, max_length=3)
    DEPARTURE_TIME: int = Field(ge=0, le=2359)
    DISTANCE: int = Field(ge=1)
    DAY_OF_WEEK: int = Field(ge=1, le=7)