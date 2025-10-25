import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "../services/notifications.service";
import { CreateNotificationDto } from "../dto/create-notification.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class NotificationsController extends BaseController {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create a notification (Admin only)" })
  @ApiResponse({ status: 201, description: "Notification created" })
  async create(@CurrentUser() user: User, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all notifications for current user" })
  @ApiQuery({ name: "unreadOnly", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "List of notifications" })
  async findAll(
    @CurrentUser() user: User,
    @Query("unreadOnly") unreadOnly?: boolean
  ) {
    return this.notificationsService.findAll(user.id, unreadOnly);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({ status: 200, description: "Unread count" })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get notification by ID" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 200, description: "Notification details" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.notificationsService.findOne(id, user.id);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  async markAsRead(@CurrentUser() user: User, @Param("id") id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 204, description: "All notifications marked as read" })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete notification" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 204, description: "Notification deleted" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.notificationsService.remove(id, user.id);
  }
}
