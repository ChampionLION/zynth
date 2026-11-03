package app.zynth.skillforge;

import org.junit.Test;
import java.time.*;
import static org.junit.Assert.*;

public class FocusPolicyTest {
    private final String owner = "11111111-1111-4111-8111-111111111111";
    private final String quest = "22222222-2222-4222-8222-222222222222";

    @Test public void schedulesTodayOrTomorrowInDeviceTimezone() {
        var morning = ZonedDateTime.parse("2026-11-03T09:00:00+01:00[Africa/Lagos]");
        assertEquals("2026-11-03T18:00+01:00[Africa/Lagos]", FocusPolicy.next("18:00", morning).toString());
        assertEquals("2026-11-04T18:00+01:00[Africa/Lagos]", FocusPolicy.next("18:00", morning.withHour(18)).toString());
    }

    @Test public void handlesDaylightSavingGapAndRepeatedTime() {
        var gap = ZonedDateTime.parse("2026-03-08T01:00:00-05:00[America/New_York]");
        assertEquals(3, FocusPolicy.next("02:30", gap).getHour());
        var overlap = ZonedDateTime.parse("2026-11-01T01:45:00-04:00[America/New_York]");
        assertEquals(ZonedDateTime.parse("2026-11-01T01:30:00-05:00[America/New_York]"), FocusPolicy.next("01:30", overlap));
    }

    @Test public void durationExpiresWithoutBecomingNegative() {
        assertEquals(180_000, FocusPolicy.remaining(50_000, 50_000));
        assertEquals(1, FocusPolicy.remaining(50_000, 229_999));
        assertEquals(0, FocusPolicy.remaining(50_000, 230_000));
        assertEquals(0, FocusPolicy.remaining(50_000, 900_000));
    }

    @Test public void onlyTheBoundAccountAndQuestCanFinishEarly() {
        assertTrue(FocusPolicy.completed(owner, quest, owner, quest));
        assertFalse(FocusPolicy.completed(owner, quest, quest, quest));
        assertFalse(FocusPolicy.completed(owner, quest, owner, owner));
        assertFalse(FocusPolicy.completed("", "", "", ""));
        assertFalse(FocusPolicy.completed(owner, null, owner, quest));
    }

    @Test public void invalidClockValuesCannotBeStored() {
        for (String value : new String[]{"24:00", "18:60", "8:00", "12:00:00", "", null}) {
            try { FocusPolicy.time(value); fail("Accepted invalid time: " + value); }
            catch (IllegalArgumentException expected) { /* rejected before scheduling */ }
        }
        assertEquals(LocalTime.MIDNIGHT, FocusPolicy.time("00:00"));
    }
    @Test public void remindersRespectTheirWindowAndSelectedInterval() {
        assertEquals(300_000, FocusPolicy.repeatAt(0, 1_800_000, 5));
        assertEquals(600_000, FocusPolicy.repeatAt(0, 1_800_000, 10));
        assertEquals(900_000, FocusPolicy.repeatAt(0, 1_800_000, 15));
        assertEquals(-1, FocusPolicy.repeatAt(1_500_000, 1_800_000, 5));
        assertEquals(-1, FocusPolicy.repeatAt(1_800_000, 1_800_000, 5));
        assertEquals(-1, FocusPolicy.repeatAt(100, 0, 5)); // canceled/completed
    }
}
