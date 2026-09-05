import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { UploadFileDto, UpdateFileDto } from './dtos/vault.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('vault')
@Controller('trips/:tripId/vault')
export class VaultController {
  constructor(private vaultService: VaultService) {}

  @Post('files')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Upload a file to trip vault' })
  async uploadFile(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Body() dto: Partial<UploadFileDto>,
    @UploadedFile() file?: MulterFile,
  ) {
    const name = dto?.name || file?.originalname || 'document';
    const mimeType = dto?.mimeType || file?.mimetype || 'application/octet-stream';
    const parsedSize = dto?.size !== undefined ? Number(dto.size) : file?.size;

    const uploadDto: UploadFileDto = {
      name,
      mimeType,
      size: isNaN(parsedSize as number) ? file?.size || 0 : parsedSize,
      fileData: dto?.fileData,
    };

    return this.vaultService.uploadFile(tripId, req.user.sub, uploadDto, file?.buffer);
  }

  @Get('files')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all files in trip vault' })
  async listFiles(@Param('tripId') tripId: string, @Req() req: any) {
    return this.vaultService.listFiles(tripId, req.user.sub);
  }

  @Get('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file details' })
  async getFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    return this.vaultService.getFile(tripId, fileId, req.user.sub);
  }

  @Put('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update file (rename)' })
  async updateFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
    @Body() dto: UpdateFileDto,
  ) {
    return this.vaultService.updateFile(tripId, fileId, req.user.sub, dto);
  }

  @Delete('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    return this.vaultService.deleteFile(tripId, fileId, req.user.sub);
  }
}
