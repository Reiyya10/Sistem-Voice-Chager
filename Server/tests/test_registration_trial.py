import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

db_fd, test_db_path = tempfile.mkstemp(suffix=".db")
os.close(db_fd)
os.environ["SUARAKU_DB"] = test_db_path

from fastapi.testclient import TestClient
import main


def tearDownModule():
    if os.path.exists(test_db_path):
        os.remove(test_db_path)


class RegistrationTrialTests(unittest.TestCase):
    def test_new_account_receives_90_day_premium_trial(self):
        client = TestClient(main.app)
        response = client.post(
            "/auth/register",
            data={
                "name": "Trial User",
                "email": "trial@example.test",
                "password": "secure-password",
            },
        )

        self.assertEqual(response.status_code, 200)
        user = response.json()["user"]
        self.assertTrue(user["premium"])
        remaining = datetime.fromisoformat(user["premium_until"]) - datetime.now(timezone.utc)
        self.assertGreater(remaining, timedelta(days=89))
        self.assertLessEqual(remaining, timedelta(days=90))

        duplicate = client.post(
            "/auth/register",
            data={
                "name": "Trial User",
                "email": "trial@example.test",
                "password": "secure-password",
            },
        )
        self.assertEqual(duplicate.status_code, 409)

        with main.db() as conn:
            trials = conn.execute(
                "SELECT plan, amount, status FROM payments WHERE user_id=?",
                (user["id"],),
            ).fetchall()
        self.assertEqual([tuple(row) for row in trials], [("3_month_trial", 0, "trial")])


if __name__ == "__main__":
    unittest.main()
