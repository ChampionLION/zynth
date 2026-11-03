package app.zynth.skillforge;

import java.time.*;

/** Pure policy: wall-clock scheduling and monotonic session duration stay separate. */
public final class FocusPolicy {
    public static final long DURATION_MS = 180_000;
    public static LocalTime time(String text) {
        if (text == null || !text.matches("(?:[01]\\d|2[0-3]):[0-5]\\d")) throw new IllegalArgumentException("Choose a valid time.");
        return LocalTime.parse(text);
    }
    public static ZonedDateTime next(String text, ZonedDateTime now) {
        ZonedDateTime candidate = now.toLocalDate().atTime(time(text)).atZone(now.getZone());
        if (!candidate.isAfter(now)) candidate = candidate.withLaterOffsetAtOverlap();
        if (!candidate.isAfter(now)) candidate = now.toLocalDate().plusDays(1).atTime(time(text)).atZone(now.getZone());
        return candidate;
    }
    public static long remaining(long started, long now) { return Math.max(0, DURATION_MS - Math.max(0, now - started)); }
    public static long repeatAt(long now, long until, int minutes) {
        if (minutes != 5 && minutes != 10 && minutes != 15) throw new IllegalArgumentException("Choose a 5, 10 or 15 minute reminder interval.");
        long next = now + minutes * 60_000L;
        return now < until && next < until ? next : -1;
    }
    public static boolean isOwner(String value) { return value != null && value.matches("(?i)[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}"); }
    public static boolean completed(String boundOwner, String boundQuest, String owner, String quest) {
        return isOwner(boundOwner) && boundOwner.equals(owner) && isOwner(boundQuest) && boundQuest.equals(quest);
    }
    private FocusPolicy() {}
}
