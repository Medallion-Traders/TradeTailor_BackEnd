from locust import HttpUser, task, between, TaskSet

class UserBehavior(TaskSet):
    @task
    def load_companies(self):
        self.client.get("/data/companies")

    @task
    def load_stock_price(self):
        self.client.get("/data/stock-price/AAPL")  

    @task
    def get_all_notifications(self):
        self.client.get("/notifications/getAllNotifications")

    @task
    def get_all_posts(self):
        self.client.get("/posts/")

    @task
    def get_pending_orders(self):
        self.client.get("/summary/pending-orders")

    @task
    def get_open_positions(self):
        self.client.get("/summary/open-positions")

    @task
    def get_pending_orders(self):
        self.client.get("/summary/closed-positions")

    @task
    def order(self):
        self.client.post("/transactions/order", 
                         json= {
                             "company": "AAPL", 
                             "quantity": 10, 
                             "orderType": "market",
                             "totalAmount": 1000,
                             "unitPrice": 100, 
                             "transactionType": "buy"
                             }
                        )  

    @task
    def get_user_balance(self):
        self.client.get("/auth/balance")

    @task
    def get_user_info(self):
        self.client.get("/auth/info")

    @task
    def get_stock_percentages(self):
        self.client.get("/charts/stock-percentages")

    @task
    def get_profit_loss(self):
        self.client.get("/charts/profit-loss")


class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(5, 15)
