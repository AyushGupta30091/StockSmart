import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private isConnected = false;

  productChange$ = new Subject<any>();
  stockChange$ = new Subject<any>();
  notification$ = new Subject<any>();

  constructor(private toastService: ToastService) {
    this.connect();
  }

  connect() {
    try {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          // console.log(str);
        }
      });

      this.stompClient.onConnect = () => {
        this.isConnected = true;
        console.log('Connected to StockSmart WebSocket');

        // Subscribe to global notifications
        this.stompClient?.subscribe('/topic/notifications', (message) => {
          try {
            const notif = JSON.parse(message.body);
            this.notification$.next(notif);
            this.toastService.show(
              notif.title || 'StockSmart Notification',
              notif.message || '',
              (notif.type?.toLowerCase() as any) || 'info'
            );
          } catch (e) {
            console.error('Error parsing notification message', e);
          }
        });

        // Subscribe to real-time product updates (Staff -> Manager -> Admin)
        this.stompClient?.subscribe('/topic/products', (message) => {
          try {
            const data = JSON.parse(message.body);
            this.productChange$.next(data);
          } catch (e) {
            console.error('Error parsing product message', e);
          }
        });

        // Subscribe to real-time inventory updates
        this.stompClient?.subscribe('/topic/inventory', (message) => {
          try {
            const data = JSON.parse(message.body);
            this.stockChange$.next(data);
          } catch (e) {
            console.error('Error parsing stock message', e);
          }
        });
      };

      this.stompClient.onStompError = (frame) => {
        console.warn('STOMP error: ', frame.headers['message']);
        this.isConnected = false;
      };

      this.stompClient.onWebSocketClose = () => {
        this.isConnected = false;
      };

      this.stompClient.activate();
    } catch (e) {
      console.warn('WebSocket initialization fallback to polling mode:', e);
    }
  }

  ngOnDestroy() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
